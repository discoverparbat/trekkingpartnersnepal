// End-to-end encryption for private messages (browser only, uses the built-in Web Crypto API).
//
// How it works
// • Each member has an ECDH P-256 key pair. The public half is published; the private half never
//   leaves the browser unencrypted.
// • To sync across devices, the private key is encrypted with the member's messages password
//   (PBKDF2-SHA256, 310,000 rounds → AES-GCM) before it's stored. We can't decrypt it.
// • Two members derive the same AES-GCM key from their key pairs (ECDH → HKDF with the conversation id),
//   and every message is encrypted with a fresh random IV. The conversation and sender ids are bound in
//   as associated data, so a message can't be moved to another chat or re-attributed.
// • On this device the unlocked private key is kept in IndexedDB as a non-extractable key.
// Nothing in this file talks to the network.

const enc = new TextEncoder();
const dec = new TextDecoder();
export const KDF_ITERATIONS = 310_000;

export const b64 = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
};
export const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const rand = (n: number) => crypto.getRandomValues(new Uint8Array(n));

const ECDH = { name: 'ECDH', namedCurve: 'P-256' } as const;

export interface WrappedKey {
  public_jwk: JsonWebKey;
  wrapped_key: string;
  salt: string;
  iv: string;
  iterations: number;
}

async function passwordKey(password: string, salt: Uint8Array, iterations: number) {
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
  );
}

/** New key pair. Returns the private key (non-extractable, for this device) and the wrapped copy to store. */
export async function createKeyPair(password: string): Promise<{ privateKey: CryptoKey; wrapped: WrappedKey }> {
  const pair = await crypto.subtle.generateKey(ECDH, true, ['deriveBits']);
  const pkcs8 = await crypto.subtle.exportKey('pkcs8', pair.privateKey);
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const public_jwk: JsonWebKey = { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y };
  const salt = rand(16), iv = rand(12);
  const kek = await passwordKey(password, salt, KDF_ITERATIONS);
  const wrappedBytes = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, kek, pkcs8);
  const privateKey = await crypto.subtle.importKey('pkcs8', pkcs8, ECDH, false, ['deriveBits']);
  return {
    privateKey,
    wrapped: { public_jwk, wrapped_key: b64(wrappedBytes), salt: b64(salt), iv: b64(iv), iterations: KDF_ITERATIONS },
  };
}

/** Unlock the stored private key with the messages password. Throws if the password is wrong. */
export async function unwrapPrivateKey(w: Omit<WrappedKey, 'public_jwk'>, password: string): Promise<CryptoKey> {
  const kek = await passwordKey(password, unb64(w.salt), w.iterations);
  const pkcs8 = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(w.iv) }, kek, unb64(w.wrapped_key));
  return crypto.subtle.importKey('pkcs8', pkcs8, ECDH, false, ['deriveBits']);
}

export const importPublicKey = (jwk: JsonWebKey) =>
  crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y, ext: true }, ECDH, true, []);

/** The shared key for one conversation between my private key and their public key. */
export async function conversationKey(myPrivate: CryptoKey, theirPublicJwk: JsonWebKey, conversationId: string) {
  const theirs = await importPublicKey(theirPublicJwk);
  const bits = await crypto.subtle.deriveBits({ name: 'ECDH', public: theirs }, myPrivate, 256);
  const hkdf = await crypto.subtle.importKey('raw', bits, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: enc.encode(conversationId), info: enc.encode('tpn-dm-v1') },
    hkdf, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
  );
}

const aad = (conversationId: string, senderId: string) => enc.encode(`${conversationId}|${senderId}`);

export async function encryptMessage(key: CryptoKey, text: string, conversationId: string, senderId: string) {
  const iv = rand(12);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad(conversationId, senderId) }, key, enc.encode(text));
  return { ciphertext: b64(ct), iv: b64(iv) };
}

export async function decryptMessage(key: CryptoKey, ciphertext: string, iv: string, conversationId: string, senderId: string) {
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: unb64(iv), additionalData: aad(conversationId, senderId) }, key, unb64(ciphertext));
  return dec.decode(pt);
}

/** Short code both people can compare to be sure nobody swapped keys (shown in the chat menu). */
export async function safetyCode(jwkA: JsonWebKey, jwkB: JsonWebKey) {
  const parts = [`${jwkA.x}.${jwkA.y}`, `${jwkB.x}.${jwkB.y}`].sort().join('|');
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(parts)));
  const digits = Array.from(hash.slice(0, 10), (b) => String(b % 100).padStart(2, '0')).join('');
  return digits.match(/.{5}/g)!.join(' ');
}

// ── This device's unlocked key (IndexedDB) ───────────────────
const DB = 'tpn-messages', STORE = 'keys';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDeviceKey(userId: string, keyId: string, privateKey: CryptoKey) {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ keyId, privateKey }, userId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch { /* private browsing etc.: the key just stays in memory for this visit */ }
}

export async function loadDeviceKey(userId: string): Promise<{ keyId: string; privateKey: CryptoKey } | null> {
  try {
    const db = await openDb();
    const row = await new Promise<any>((resolve, reject) => {
      const req = db.transaction(STORE).objectStore(STORE).get(userId);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return row;
  } catch { return null; }
}

export async function forgetDeviceKey(userId: string) {
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(userId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    db.close();
  } catch {}
}

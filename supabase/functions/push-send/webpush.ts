// Minimal Web Push sender using only Web Crypto (works in Deno / Supabase Edge Functions and Node 20+).
//   • Payload encryption: RFC 8291 (aes128gcm, RFC 8188)
//   • Server identification: VAPID, RFC 8292 (ES256 JWT)
// No npm packages, so nothing to break when the runtime updates.

export interface PushSubscriptionKeys {
  endpoint: string;
  p256dh: string; // base64url, 65-byte uncompressed P-256 public key from the browser
  auth: string;   // base64url, 16-byte auth secret from the browser
}

export interface Vapid {
  publicKey: string;  // base64url, 65 bytes
  privateKey: string; // base64url, 32 bytes (the "d" value)
  subject: string;    // mailto: or https: contact
}

export interface SendOptions {
  ttl?: number;                     // seconds the push service keeps it if the device is offline
  urgency?: 'very-low' | 'low' | 'normal' | 'high';
  topic?: string;                   // newer push with the same topic replaces an undelivered older one
}

const enc = new TextEncoder();

export function b64uDecode(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function b64uEncode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

async function hmac(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey('raw', key as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, data as BufferSource));
}

/** Encrypts `plaintext` for one browser subscription (RFC 8291). Returns the aes128gcm body. */
export async function encryptPayload(sub: PushSubscriptionKeys, plaintext: Uint8Array, salt?: Uint8Array): Promise<Uint8Array> {
  const uaPublic = b64uDecode(sub.p256dh);
  const authSecret = b64uDecode(sub.auth);
  if (uaPublic.length !== 65 || authSecret.length < 16) throw new Error('bad subscription keys');
  salt ??= crypto.getRandomValues(new Uint8Array(16));

  // One-off key pair for this message
  const as = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']) as CryptoKeyPair;
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', as.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', uaPublic as BufferSource, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, as.privateKey, 256));

  const prkKey = await hmac(authSecret, ecdh);
  const ikm = await hmac(prkKey, concat(enc.encode('WebPush: info\0'), uaPublic, asPublic, new Uint8Array([1])));
  const prk = await hmac(salt, ikm);
  const cek = (await hmac(prk, concat(enc.encode('Content-Encoding: aes128gcm\0'), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hmac(prk, concat(enc.encode('Content-Encoding: nonce\0'), new Uint8Array([1])))).slice(0, 12);

  const aes = await crypto.subtle.importKey('raw', cek as BufferSource, 'AES-GCM', false, ['encrypt']);
  const record = concat(plaintext, new Uint8Array([2]));   // 0x02 = last (and only) record
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce as BufferSource }, aes, record as BufferSource));

  const rs = 4096;
  const header = concat(salt, new Uint8Array([(rs >>> 24) & 255, (rs >>> 16) & 255, (rs >>> 8) & 255, rs & 255]),
    new Uint8Array([asPublic.length]), asPublic);
  return concat(header, ciphertext);
}

const jwtCache = new Map<string, { token: string; exp: number }>();
let signingKey: Promise<CryptoKey> | null = null;

/** VAPID Authorization header for the push service that owns `endpoint` (RFC 8292). */
export async function vapidAuth(endpoint: string, vapid: Vapid): Promise<string> {
  const aud = new URL(endpoint).origin;
  const now = Math.floor(Date.now() / 1000);
  const cached = jwtCache.get(aud);
  if (cached && cached.exp - now > 3600) return `vapid t=${cached.token}, k=${vapid.publicKey}`;

  if (!signingKey) {
    const pub = b64uDecode(vapid.publicKey);
    signingKey = crypto.subtle.importKey('jwk', {
      kty: 'EC', crv: 'P-256', d: vapid.privateKey,
      x: b64uEncode(pub.slice(1, 33)), y: b64uEncode(pub.slice(33, 65)), ext: true,
    }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  }
  const exp = now + 12 * 3600;
  const head = b64uEncode(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = b64uEncode(enc.encode(JSON.stringify({ aud, exp, sub: vapid.subject })));
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, await signingKey, enc.encode(`${head}.${body}`));
  const token = `${head}.${body}.${b64uEncode(sig)}`;
  jwtCache.set(aud, { token, exp });
  return `vapid t=${token}, k=${vapid.publicKey}`;
}

/** Sends one push. Returns the HTTP status from the push service (201 = delivered, 404/410 = subscription gone). */
export async function sendPush(sub: PushSubscriptionKeys, payload: unknown, vapid: Vapid, opts: SendOptions = {}): Promise<number> {
  const body = await encryptPayload(sub, enc.encode(JSON.stringify(payload)));
  const headers: Record<string, string> = {
    Authorization: await vapidAuth(sub.endpoint, vapid),
    'Content-Encoding': 'aes128gcm',
    'Content-Type': 'application/octet-stream',
    TTL: String(opts.ttl ?? 86400),
    Urgency: opts.urgency ?? 'normal',
  };
  if (opts.topic) headers.Topic = opts.topic;
  const res = await fetch(sub.endpoint, { method: 'POST', headers, body: body as BufferSource });
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    console.error('push service error', res.status, (await res.text()).slice(0, 300));
  } else {
    await res.body?.cancel();
  }
  return res.status;
}

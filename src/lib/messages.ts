// Private one-to-one messages: loading, sending, blocking and reporting (browser only).
// All message text is encrypted / decrypted here in the browser – see e2e.ts.
// The database (update-22-messages.sql) only ever sees ciphertext.
import { supabase } from './supabase';
import { fetchProfiles, type Author } from './posts';
import { getTrek } from '../data/treks';
import * as e2e from './e2e';

export const MAX_MESSAGE = 4000;

export interface KeyRow { key_id: string; wrapped_key: string; salt: string; iv: string; iterations: number }
export interface DeviceKey { keyId: string; privateKey: CryptoKey }

export interface Conversation {
  id: string;
  other_id: string;
  trip_id: string | null;
  created_at: string;
  last_message_at: string | null;
  unread: boolean;
  blocked_by_me: boolean;
  blocked: boolean;
  started_by_me: boolean;
  other?: Author;
  trek?: string | null;          // trek name of the partner post it started from
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  created_at: string;
  text: string | null;            // null = can't be decrypted on this device (key was reset)
  mine: boolean;
}

// ── Keys ─────────────────────────────────────────────────────
export async function getMyKeyRow(userId: string): Promise<KeyRow | null> {
  const { data } = await supabase.from('message_keys')
    .select('key_id, wrapped_key, salt, iv, iterations').eq('user_id', userId).maybeSingle();
  return (data as KeyRow) ?? null;
}

/** This device's unlocked key, if it matches the account's current key. */
export async function deviceKey(userId: string, row: KeyRow): Promise<DeviceKey | null> {
  const saved = await e2e.loadDeviceKey(userId);
  return saved && saved.keyId === row.key_id ? saved : null;
}

/** First setup, or a reset after a forgotten password. */
export async function createKeys(userId: string, password: string): Promise<DeviceKey> {
  const { privateKey, wrapped } = await e2e.createKeyPair(password);
  const { data, error } = await supabase.rpc('set_message_key', {
    public_jwk: wrapped.public_jwk, wrapped_key: wrapped.wrapped_key, salt: wrapped.salt,
    iv: wrapped.iv, iterations: wrapped.iterations,
  });
  if (error) throw new Error(error.message);
  const keyId = data as string;
  await e2e.saveDeviceKey(userId, keyId, privateKey);
  return { keyId, privateKey };
}

/** Unlock on a new device with the messages password. Throws "wrong-password". */
export async function unlockKeys(userId: string, row: KeyRow, password: string): Promise<DeviceKey> {
  let privateKey: CryptoKey;
  try { privateKey = await e2e.unwrapPrivateKey(row, password); }
  catch { throw new Error('wrong-password'); }
  await e2e.saveDeviceKey(userId, row.key_id, privateKey);
  return { keyId: row.key_id, privateKey };
}

export const lockDevice = (userId: string) => e2e.forgetDeviceKey(userId);

// ── Conversations ────────────────────────────────────────────
export async function listConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase.rpc('my_conversations');
  if (error || !data) return [];
  const list = data as Conversation[];
  const tripIds = [...new Set(list.map((c) => c.trip_id).filter(Boolean))] as string[];
  const [people, trips] = await Promise.all([
    fetchProfiles(list.map((c) => c.other_id)),
    tripIds.length ? supabase.from('trips').select('id, trek').in('id', tripIds) : Promise.resolve({ data: [] as any[] }),
  ]);
  const byId = new Map(people.map((p) => [p.id, p]));
  const trekOf = new Map((trips.data ?? []).map((t: any) => [t.id, getTrek(t.trek)?.name ?? t.trek]));
  return list.map((c) => ({ ...c, other: byId.get(c.other_id), trek: c.trip_id ? trekOf.get(c.trip_id) ?? null : null }));
}

export type StartResult = { id: string } | { error: 'limit' | 'blocked' | 'self' | 'profile' | 'unavailable' | string; id?: string };

export async function startConversation(otherId: string, tripId?: string | null): Promise<StartResult> {
  const { data, error } = await supabase.rpc('start_conversation', { other: otherId, trip: tripId ?? null });
  if (error) return { error: error.message };
  return data as StartResult;
}

export const START_ERRORS: Record<string, string> = {
  limit: 'You can start conversations with up to 5 new people a day. You can keep chatting with people you’ve already messaged – try again tomorrow for someone new.',
  blocked: 'You can’t message this trekker.',
  self: 'That’s you!',
  profile: 'Complete your profile first – name, age and nationality.',
  unavailable: 'This trekker can’t receive messages.',
};

export async function markRead(conversationId: string) {
  await supabase.rpc('mark_conversation_read', { c: conversationId });
}

export async function unreadCount(): Promise<number> {
  const { data } = await supabase.rpc('unread_conversation_count');
  return (data as number) ?? 0;
}

// ── One chat ─────────────────────────────────────────────────
export class Chat {
  private shared = new Map<string, Promise<CryptoKey>>();   // "myKeyId|theirKeyId" → AES key
  private jwks = new Map<string, JsonWebKey>();               // public key id → JWK

  constructor(readonly convo: Conversation, readonly me: string, readonly key: DeviceKey) {}

  private async publicKeys(ids: string[]) {
    const missing = [...new Set(ids)].filter((id) => !this.jwks.has(id));
    if (!missing.length) return;
    const { data } = await supabase.from('message_public_keys').select('key_id, public_jwk').in('key_id', missing);
    for (const r of data ?? []) this.jwks.set((r as any).key_id, (r as any).public_jwk);
  }

  private sharedKey(theirKeyId: string): Promise<CryptoKey> | null {
    const jwk = this.jwks.get(theirKeyId);
    if (!jwk) return null;
    const k = `${this.key.keyId}|${theirKeyId}`;
    if (!this.shared.has(k)) this.shared.set(k, e2e.conversationKey(this.key.privateKey, jwk, this.convo.id));
    return this.shared.get(k)!;
  }

  async decryptRows(rows: any[]): Promise<ChatMessage[]> {
    await this.publicKeys(rows.map((r) => (r.sender_id === this.me ? r.recipient_key_id : r.sender_key_id)));
    return Promise.all(rows.map(async (r): Promise<ChatMessage> => {
      const mine = r.sender_id === this.me;
      const myKeyId = mine ? r.sender_key_id : r.recipient_key_id;
      const theirKeyId = mine ? r.recipient_key_id : r.sender_key_id;
      let text: string | null = null;
      if (myKeyId === this.key.keyId) {
        const k = this.sharedKey(theirKeyId);
        if (k) {
          try { text = await e2e.decryptMessage(await k, r.ciphertext, r.iv, this.convo.id, r.sender_id); } catch {}
        }
      }
      return { id: r.id, sender_id: r.sender_id, created_at: r.created_at, text, mine };
    }));
  }

  async load(limit = 200): Promise<ChatMessage[]> {
    const { data } = await supabase.from('messages')
      .select('id, sender_id, sender_key_id, recipient_key_id, ciphertext, iv, created_at')
      .eq('conversation_id', this.convo.id).order('created_at', { ascending: false }).limit(limit);
    return this.decryptRows((data ?? []).reverse());
  }

  /** The other person's current public key, or null if they haven't set up messages yet. */
  async theirKey(): Promise<{ key_id: string; public_jwk: JsonWebKey } | null> {
    const { data } = await supabase.rpc('current_message_key', { other: this.convo.other_id });
    const row = (data as any[])?.[0];
    if (!row) return null;
    this.jwks.set(row.key_id, row.public_jwk);
    return row;
  }

  async send(text: string) {
    const theirs = await this.theirKey();
    if (!theirs) throw new Error('no-key');
    const k = await this.sharedKey(theirs.key_id)!;
    const { ciphertext, iv } = await e2e.encryptMessage(k, text, this.convo.id, this.me);
    const { data, error } = await supabase.from('messages').insert({
      conversation_id: this.convo.id, sender_key_id: this.key.keyId, recipient_key_id: theirs.key_id, ciphertext, iv,
    }).select('id, sender_id, sender_key_id, recipient_key_id, ciphertext, iv, created_at').single();
    if (error) throw new Error(error.message);
    return (await this.decryptRows([data]))[0];
  }

  /** Short code both people can compare, to check nobody swapped keys. */
  async safetyCode(): Promise<string | null> {
    const theirs = await this.theirKey();
    const { data: mine } = await supabase.from('message_public_keys').select('public_jwk').eq('key_id', this.key.keyId).maybeSingle();
    if (!theirs || !mine) return null;
    return e2e.safetyCode((mine as any).public_jwk, theirs.public_jwk);
  }

  /** Live updates for this chat. Returns an unsubscribe function. */
  watch(onMessage: (m: ChatMessage) => void) {
    const ch = supabase.channel(`chat-${this.convo.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${this.convo.id}` },
        async (payload) => { const [m] = await this.decryptRows([payload.new]); onMessage(m); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }
}

/** Calls `onChange` when any of my conversations changes (new message, new chat). */
export function watchConversations(userId: string, onChange: () => void) {
  const ch = supabase.channel(`convos-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, onChange)
    .subscribe();
  return () => { supabase.removeChannel(ch); };
}

// ── Block and report ─────────────────────────────────────────
export async function block(otherId: string) {
  const { error } = await supabase.from('message_blocks').insert({ blocked_id: otherId });
  if (error && error.code !== '23505') throw new Error(error.message);
}

export async function unblock(otherId: string, me: string) {
  const { error } = await supabase.from('message_blocks').delete().eq('blocker_id', me).eq('blocked_id', otherId);
  if (error) throw new Error(error.message);
}

/**
 * Report a conversation. The last messages are decrypted on this device and sent with the report,
 * so the admin can see what happened – that excerpt is the only message content the admin ever sees.
 */
export async function reportConversation(convo: Conversation, recent: ChatMessage[], reason: string, details: string | null) {
  const evidence = recent.filter((m) => m.text !== null).slice(-20).map((m) => ({
    from: m.mine ? 'reporter' : 'reported', at: m.created_at, text: (m.text as string).slice(0, 600),
  }));
  const { error } = await supabase.from('reports').insert({
    kind: 'conversation', target_id: convo.id, reported_user: convo.other_id, reason, details, evidence,
  });
  if (error && error.code !== '23505') throw new Error(error.message);
  return !error;
}

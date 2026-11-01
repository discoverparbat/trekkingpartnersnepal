// Private one-to-one messages: loading, sending, blocking and reporting (browser only).
// Messages are stored as text; row-level security means only the two people in a chat can read them
// (update-24-messages-no-password.sql). e2e.ts is only used to restore messages sent before update 24.
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
  text: string | null;            // null = old encrypted message not restored yet
  mine: boolean;
}

// ── Old encrypted messages (before update 24) ────────────────
// Messages sent before update 24 were end-to-end encrypted. They're restored once: when the member opens
// Messages on a device that still holds their old key, or enters their old messages password.
async function getMyKeyRow(userId: string): Promise<KeyRow | null> {
  const { data } = await supabase.from('message_keys')
    .select('key_id, wrapped_key, salt, iv, iterations').eq('user_id', userId).maybeSingle();
  return (data as KeyRow) ?? null;
}

/** How many messages in my chats still need restoring, and whether I have an old key to restore them with. */
export async function lockedStatus(userId: string): Promise<{ count: number; row: KeyRow | null; device: DeviceKey | null }> {
  const { data } = await supabase.rpc('locked_message_count');
  const count = (data as number) ?? 0;
  if (!count) return { count, row: null, device: null };
  const row = await getMyKeyRow(userId);
  if (!row) return { count, row, device: null };
  const saved = await e2e.loadDeviceKey(userId);
  return { count, row, device: saved && saved.keyId === row.key_id ? saved : null };
}

/** Unlock the old key with the old messages password. Throws "wrong-password". */
export async function unlockOldKey(userId: string, row: KeyRow, password: string): Promise<DeviceKey> {
  let privateKey: CryptoKey;
  try { privateKey = await e2e.unwrapPrivateKey(row, password); }
  catch { throw new Error('wrong-password'); }
  return { keyId: row.key_id, privateKey };
}

/** Decrypt every old message I can and save the text for both people. Returns how many were restored. */
export async function restoreOldMessages(userId: string, key: DeviceKey): Promise<number> {
  const { data: rows } = await supabase.from('messages')
    .select('id, conversation_id, sender_id, sender_key_id, recipient_key_id, ciphertext, iv')
    .is('body', null).limit(1000);
  if (!rows?.length) return 0;

  const theirIds = [...new Set(rows.map((r: any) => (r.sender_id === userId ? r.recipient_key_id : r.sender_key_id)))];
  const { data: pubs } = await supabase.from('message_public_keys').select('key_id, public_jwk').in('key_id', theirIds);
  const jwk = new Map((pubs ?? []).map((p: any) => [p.key_id, p.public_jwk]));

  const items: { id: string; body: string }[] = [];
  for (const r of rows as any[]) {
    const mine = r.sender_id === userId;
    if ((mine ? r.sender_key_id : r.recipient_key_id) !== key.keyId) continue;
    const theirs = jwk.get(mine ? r.recipient_key_id : r.sender_key_id);
    if (!theirs || !r.ciphertext) continue;
    try {
      const k = await e2e.conversationKey(key.privateKey, theirs, r.conversation_id);
      items.push({ id: r.id, body: await e2e.decryptMessage(k, r.ciphertext, r.iv, r.conversation_id, r.sender_id) });
    } catch { /* can't be read with this key */ }
  }
  if (!items.length) return 0;
  const { data, error } = await supabase.rpc('restore_messages', { items });
  if (error) throw new Error(error.message);
  return (data as number) ?? 0;
}

/** Stop asking about old messages (they stay saved, encrypted, in case the other person restores them). */
const SKIP_KEY = 'tpn-skip-old-messages';
export const skipOld = () => { try { localStorage.setItem(SKIP_KEY, '1'); } catch {} };
export const skippedOld = () => { try { return localStorage.getItem(SKIP_KEY) === '1'; } catch { return false; } };

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
const COLS = 'id, sender_id, body, created_at';
const toMessage = (r: any, me: string): ChatMessage =>
  ({ id: r.id, sender_id: r.sender_id, created_at: r.created_at, text: r.body ?? null, mine: r.sender_id === me });

export class Chat {
  constructor(readonly convo: Conversation, readonly me: string) {}

  async load(limit = 200): Promise<ChatMessage[]> {
    const { data } = await supabase.from('messages').select(COLS)
      .eq('conversation_id', this.convo.id).order('created_at', { ascending: false }).limit(limit);
    return (data ?? []).reverse().map((r) => toMessage(r, this.me));
  }

  async send(text: string) {
    const { data, error } = await supabase.from('messages')
      .insert({ conversation_id: this.convo.id, body: text }).select(COLS).single();
    if (error) throw new Error(error.message);
    return toMessage(data, this.me);
  }

  /** Live updates for this chat (new messages, and old ones being restored). Returns an unsubscribe function. */
  watch(onMessage: (m: ChatMessage) => void) {
    const ch = supabase.channel(`chat-${this.convo.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${this.convo.id}` },
        (payload) => { if (payload.new && (payload.new as any).id) onMessage(toMessage(payload.new, this.me)); })
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

/** Report a conversation. The last 20 messages go with the report so the admin can see what happened. */
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

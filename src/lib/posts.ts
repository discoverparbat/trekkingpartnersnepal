// Partner posts: loading from Supabase and building cards (browser only).
// All user text is inserted with textContent, never as HTML.
import { supabase } from './supabase';
import { getTrek } from '../data/treks';
import { getRegion } from '../data/regions';

export interface Author {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  nationality: string | null;
  gender: string | null;
  age: number | null;
}

export interface Trip {
  id: string;
  user_id: string;
  region: string;
  trek: string;
  start_date: string;
  end_date: string | null;
  flexible: boolean;
  group_size: number | null;
  pace: string | null;
  description: string;
  status: 'open' | 'closed';
  created_at: string;
  author?: Author;
  replies: number;
}

const TRIP_COLS = 'id, user_id, region, trek, start_date, end_date, flexible, group_size, pace, description, status, created_at';
export const today = () => new Date().toISOString().slice(0, 10);

// ── Loading ─────────────────────────────────────────────────
export async function attachExtras(trips: any[]): Promise<Trip[]> {
  if (!trips.length) return [];
  const userIds = [...new Set(trips.map((t) => t.user_id))];
  const tripIds = trips.map((t) => t.id);
  const [authors, counts] = await Promise.all([
    supabase.from('public_profiles').select('id, display_name, avatar_url, nationality, gender, age').in('id', userIds),
    supabase.from('trip_comment_counts').select('trip_id, replies').in('trip_id', tripIds),
  ]);
  const byId = new Map((authors.data ?? []).map((a: Author) => [a.id, a]));
  const replies = new Map((counts.data ?? []).map((c: any) => [c.trip_id, c.replies]));
  return trips.map((t) => ({ ...t, author: byId.get(t.user_id), replies: replies.get(t.id) ?? 0 }));
}

export interface TripQuery {
  trek?: string;
  region?: string;
  userId?: string;
  limit?: number;
  all?: boolean;          // include closed and past posts (for "My posts")
}

export async function fetchTrips(q: TripQuery = {}): Promise<Trip[]> {
  let query = supabase.from('trips').select(TRIP_COLS);
  if (!q.all) {
    const t = today();
    // still upcoming or in progress
    query = query.eq('status', 'open').or(`end_date.gte.${t},and(end_date.is.null,start_date.gte.${t})`);
  }
  if (q.trek) query = query.eq('trek', q.trek);
  if (q.region) query = query.eq('region', q.region);
  if (q.userId) query = query.eq('user_id', q.userId);
  query = q.all || q.limit ? query.order('created_at', { ascending: false }) : query.order('start_date', { ascending: true });
  if (q.limit) query = query.limit(q.limit);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return attachExtras(data ?? []);
}

export async function fetchTrip(id: string): Promise<Trip | null> {
  const { data, error } = await supabase.from('trips').select(TRIP_COLS).eq('id', id).maybeSingle();
  if (error || !data) return null;
  return (await attachExtras([data]))[0];
}

// ── Formatting ──────────────────────────────────────────────
export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = '') {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

const fmt = (d: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-GB', opts);

export function dateRange(start: string, end: string | null) {
  if (!end || end === start) return fmt(start, { day: 'numeric', month: 'short', year: 'numeric' });
  const s = new Date(start), e = new Date(end);
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  return sameMonth
    ? `${fmt(start, { day: 'numeric' })}–${fmt(end, { day: 'numeric', month: 'short', year: 'numeric' })}`
    : `${fmt(start, { day: 'numeric', month: 'short' })} – ${fmt(end, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

export function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  return fmt(iso.slice(0, 10), { day: 'numeric', month: 'short', year: 'numeric' });
}

const GENDER: Record<string, string> = { female: 'Female', male: 'Male', 'non-binary': 'Non-binary' };

/** "29 · Female · Germany" */
export function authorFacts(a?: Author) {
  if (!a) return '';
  return [a.age ? String(a.age) : '', a.gender ? GENDER[a.gender] ?? '' : '', a.nationality ?? '']
    .filter(Boolean).join(' · ');
}

export const authorName = (a?: Author) => a?.display_name || 'Trekker';

export function avatar(a: Author | undefined, size = 40) {
  if (a?.avatar_url) {
    const img = el('img', 'avatar');
    img.src = a.avatar_url; img.alt = ''; img.width = size; img.height = size;
    img.referrerPolicy = 'no-referrer'; img.loading = 'lazy';
    return img;
  }
  const s = el('span', 'avatar avatar-initial', authorName(a).charAt(0).toUpperCase());
  s.style.width = s.style.height = `${size}px`;
  return s;
}

export const paceLabel = (p: string | null) => (p ? `${p[0].toUpperCase()}${p.slice(1)} pace` : '');

// ── Card ────────────────────────────────────────────────────
export function postCard(t: Trip) {
  const trek = getTrek(t.trek);
  const region = getRegion(t.region);

  const a = el('a', 'post');
  a.href = `/post/?id=${encodeURIComponent(t.id)}`;

  const who = el('div', 'post-who');
  const meta = el('div');
  meta.append(el('div', 'post-name', authorName(t.author)));
  meta.append(el('div', 'post-sub', authorFacts(t.author) || timeAgo(t.created_at)));
  who.append(avatar(t.author), meta);

  const head = el('div');
  head.append(el('div', 'post-region', region?.name ?? ''));
  head.append(el('div', 'post-trek', trek?.name ?? t.trek));

  const dates = el('span', 'post-dates', '🗓 ' + dateRange(t.start_date, t.end_date) + (t.flexible ? ' · flexible' : ''));

  const tags = el('div', 'post-tags');
  if (t.group_size) tags.append(el('span', 'badge', `Group of ${t.group_size}`));
  if (t.pace) tags.append(el('span', 'badge', paceLabel(t.pace)));
  if (t.status === 'closed') tags.append(el('span', 'badge badge-warn', 'Closed'));

  const foot = el('div', 'post-foot');
  foot.append(el('span', '', timeAgo(t.created_at)));
  foot.append(el('span', 'post-replies', t.replies === 1 ? '💬 1 reply' : `💬 ${t.replies} replies`));

  a.append(who, head, dates, el('p', 'post-text', t.description), tags, foot);
  return a;
}

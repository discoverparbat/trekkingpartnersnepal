// "From our Facebook group" posts (update 26): partner requests the admin summarises from the
// Facebook group. Shown beside member posts but clearly marked, with no Facebook name or photo,
// and the card links out to the original group post (no on-site replies or messages).
import { supabase } from './supabase';
import { getTrek } from '../data/treks';
import { getRegion } from '../data/regions';
import { el, dateRange, timeAgo, today } from './posts';

export const FB_GROUP = 'https://www.facebook.com/groups/887606059135821';

export interface GroupPost {
  id: string;
  region: string;
  trek: string;
  start_date: string;
  end_date: string | null;
  flexible: boolean;
  summary: string;
  fb_url: string;
  status: 'open' | 'closed';
  created_at: string;
}

export interface GroupPostQuery {
  trek?: string;
  region?: string;
  limit?: number;
  all?: boolean;   // admin: include closed and past posts
}

const COLS = 'id, region, trek, start_date, end_date, flexible, summary, fb_url, status, created_at';

/** Never throws: until update 26 is run (or if it fails) the site simply shows no group posts. */
export async function fetchGroupPosts(q: GroupPostQuery = {}): Promise<GroupPost[]> {
  let query = supabase.from('group_posts').select(COLS);
  if (!q.all) {
    const t = today();
    query = query.eq('status', 'open').or(`end_date.gte.${t},and(end_date.is.null,start_date.gte.${t})`);
  }
  if (q.trek) query = query.eq('trek', q.trek);
  if (q.region) query = query.eq('region', q.region);
  query = q.all || q.limit ? query.order('created_at', { ascending: false }) : query.order('start_date', { ascending: true });
  if (q.limit) query = query.limit(q.limit);
  const { data, error } = await query;
  if (error) { console.warn('Group posts:', error.message); return []; }
  return (data ?? []) as GroupPost[];
}

export const isGroupPost = (p: any): p is GroupPost => typeof p?.fb_url === 'string';

const FB_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V21h2.9z"/></svg>';
const OUT_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';

export function groupPostCard(g: GroupPost) {
  const trek = getTrek(g.trek);
  const region = getRegion(g.region);

  const a = el('a', 'post post-group');
  a.href = g.fb_url;
  a.target = '_blank';
  a.rel = 'noopener nofollow';

  const who = el('div', 'post-who');
  const icon = el('span', 'avatar group-icon');
  icon.innerHTML = FB_ICON; // fixed icon markup
  const meta = el('div');
  meta.append(el('div', 'post-name', 'From our Facebook group'));
  meta.append(el('div', 'post-sub', 'Shared by Trekking Partners Nepal'));
  who.append(icon, meta);

  const head = el('div');
  head.append(el('div', 'post-region', region?.name ?? ''));
  head.append(el('div', 'post-trek', trek?.name ?? g.trek));

  const dates = el('span', 'post-dates', '🗓 ' + dateRange(g.start_date, g.end_date) + (g.flexible ? ' · flexible' : ''));

  const tags = el('div', 'post-tags');
  if (g.status === 'closed') tags.append(el('span', 'badge badge-warn', 'Closed'));

  const foot = el('div', 'post-foot');
  foot.append(el('span', 'post-ago', 'Shared ' + timeAgo(g.created_at)));
  const btn = el('span', 'post-reply-btn post-fb-btn', 'Reply on Facebook');
  btn.insertAdjacentHTML('beforeend', OUT_ICON);
  foot.append(btn);

  a.append(who, head, dates, el('p', 'post-text', g.summary), tags, foot);
  return a;
}

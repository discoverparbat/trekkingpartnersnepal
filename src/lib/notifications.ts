// On-site notifications (the bell in the header). Browser only.
// Rows are created by database triggers – see supabase/update-8-notifications.sql.
import { supabase } from './supabase';
import { getTrek } from '../data/treks';

export interface Notice {
  id: string;
  kind: 'welcome' | 'first_post' | 'reply' | 'thread_reply';
  trip_id: string | null;
  comment_id: string | null;
  actor_id: string | null;
  count: number;
  read_at: string | null;
  created_at: string;
}

export interface NoticeView extends Notice {
  icon: string;
  text: string;          // plain text, always inserted with textContent
  strong: string;        // the bold part at the start (a name or a short headline)
  href: string;
  actorAvatar: string | null;
}

const COLS = 'id, kind, trip_id, comment_id, actor_id, count, read_at, created_at';

export async function fetchNotices(userId: string, limit = 20): Promise<NoticeView[]> {
  const { data, error } = await supabase
    .from('notifications').select(COLS)
    .eq('user_id', userId).order('created_at', { ascending: false }).limit(limit);
  if (error || !data) return [];

  const tripIds = [...new Set(data.map((n) => n.trip_id).filter(Boolean))] as string[];
  const actorIds = [...new Set(data.map((n) => n.actor_id).filter(Boolean))] as string[];
  const [trips, actors, admins] = await Promise.all([
    tripIds.length ? supabase.from('trips').select('id, trek').in('id', tripIds) : Promise.resolve({ data: [] as any[] }),
    actorIds.length ? supabase.from('public_profiles').select('id, display_name, avatar_url').in('id', actorIds) : Promise.resolve({ data: [] as any[] }),
    actorIds.length ? supabase.rpc('admin_ids') : Promise.resolve({ data: [] as any[] }),
  ]);
  const trekOf = new Map((trips.data ?? []).map((t: any) => [t.id, getTrek(t.trek)?.name ?? t.trek]));
  const adminSet = new Set<string>((admins.data ?? []).map((r: any) => (typeof r === 'string' ? r : r.admin_ids ?? r.user_id)));
  // Replies from the team account show the site name and logo, not the personal profile
  const actorOf = new Map((actors.data ?? []).map((a: any) => [a.id,
    adminSet.has(a.id) ? { display_name: 'Trekking Partners Nepal Admin', avatar_url: '/web-app-manifest-192x192.png', team: true } : a]));

  return data
    // reply notices for a post that no longer exists aren't useful
    .filter((n) => !(n.kind === 'reply' || n.kind === 'thread_reply') || trekOf.has(n.trip_id))
    .map((n) => describe(n as Notice, n.trip_id ? trekOf.get(n.trip_id) : undefined, n.actor_id ? actorOf.get(n.actor_id) : undefined));
}

function describe(n: Notice, trek?: string, actor?: { display_name: string | null; avatar_url: string | null; team?: boolean }): NoticeView {
  const who = (actor?.team ? actor.display_name : actor?.display_name?.split(' ')[0]) || 'A trekker';
  const post = n.trip_id ? `/post/?id=${encodeURIComponent(n.trip_id)}` : '/account/';
  switch (n.kind) {
    case 'welcome':
      return { ...n, icon: '👋', strong: 'Welcome to Trekking Partners Nepal!',
        text: ' Complete your profile, then post your trek or browse partner posts. Read our safety tips before you meet anyone.',
        href: '/account/', actorAvatar: null };
    case 'first_post':
      return { ...n, icon: '🎉', strong: trek ? `Your ${trek} post is live!` : 'Your first post is live!',
        text: ' Share it on WhatsApp or Facebook to find partners faster – we’ll let you know here when someone replies.',
        href: post, actorAvatar: null };
    case 'reply':
      return { ...n, icon: '💬', strong: n.count > 1 ? `${n.count} new replies` : who,
        text: n.count > 1 ? ` on your ${trek} post · latest from ${who}` : ` replied to your ${trek} post`,
        href: post + '#replies', actorAvatar: actor?.avatar_url ?? null };
    default:
      return { ...n, icon: '💬', strong: n.count > 1 ? `${n.count} new replies` : who,
        text: n.count > 1 ? ` on the ${trek} post you replied to · latest from ${who}` : ` also replied on the ${trek} post`,
        href: post + '#replies', actorAvatar: actor?.avatar_url ?? null };
  }
}

export async function unreadCount(userId: string) {
  const { count } = await supabase
    .from('notifications').select('id', { count: 'exact', head: true })
    .eq('user_id', userId).is('read_at', null);
  return count ?? 0;
}

const now = () => new Date().toISOString();

export async function markRead(ids: string[]) {
  if (!ids.length) return;
  await supabase.from('notifications').update({ read_at: now() }).in('id', ids).is('read_at', null);
}

export async function markAllRead(userId: string) {
  await supabase.from('notifications').update({ read_at: now() }).eq('user_id', userId).is('read_at', null);
}

/** Opening a post marks its reply notifications (and the first-post one) as read. */
export async function markTripRead(userId: string, tripId: string) {
  await supabase.from('notifications').update({ read_at: now() })
    .eq('user_id', userId).eq('trip_id', tripId).is('read_at', null);
}

/** Calls `onChange` whenever this user gets a new or updated notification. Returns an unsubscribe function. */
export function watchNotices(userId: string, onChange: () => void) {
  const ch = supabase
    .channel(`notices-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, onChange)
    .subscribe();
  return () => { supabase.removeChannel(ch); };
}

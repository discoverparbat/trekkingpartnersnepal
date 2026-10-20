// On-site notifications (the bell in the header). Browser only.
// Rows are created by database triggers – see supabase/update-8-notifications.sql
// and supabase/update-10-community.sql (Community answers).
import { supabase } from './supabase';
import { getTrek } from '../data/treks';

export interface Notice {
  id: string;
  kind: 'welcome' | 'first_post' | 'reply' | 'thread_reply' | 'answer' | 'thread_answer' | 'best_answer' | 'moved_to_partners';
  trip_id: string | null;
  question_id: string | null;
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

const COLS = 'id, kind, trip_id, question_id, comment_id, actor_id, count, read_at, created_at';
const QUESTION_KINDS = ['answer', 'thread_answer', 'best_answer', 'moved_to_partners'];

export async function fetchNotices(userId: string, limit = 20): Promise<NoticeView[]> {
  const load = (cols: string) => supabase
    .from('notifications').select(cols)
    .eq('user_id', userId).order('created_at', { ascending: false }).limit(limit);
  let res = await load(COLS);
  // Before update-10-community.sql has run there is no question_id column: fall back to the old list
  if (res.error) res = await load(COLS.replace('question_id, ', ''));
  if (res.error || !res.data) return [];
  const data = res.data as unknown as (Notice & { question_id: string | null })[];

  const tripIds = [...new Set(data.map((n) => n.trip_id).filter(Boolean))] as string[];
  const questionIds = [...new Set(data.map((n) => n.question_id).filter(Boolean))] as string[];
  const actorIds = [...new Set(data.map((n) => n.actor_id).filter(Boolean))] as string[];
  const [trips, questions, actors, admins] = await Promise.all([
    tripIds.length ? supabase.from('trips').select('id, trek').in('id', tripIds) : Promise.resolve({ data: [] as any[] }),
    questionIds.length ? supabase.from('questions').select('id, title, trek').in('id', questionIds) : Promise.resolve({ data: [] as any[] }),
    actorIds.length ? supabase.from('public_profiles').select('id, display_name, avatar_url').in('id', actorIds) : Promise.resolve({ data: [] as any[] }),
    actorIds.length ? supabase.rpc('admin_ids') : Promise.resolve({ data: [] as any[] }),
  ]);
  const trekOf = new Map((trips.data ?? []).map((t: any) => [t.id, getTrek(t.trek)?.name ?? t.trek]));
  const questionOf = new Map((questions.data ?? []).map((q: any) => [q.id, q as { id: string; title: string; trek: string }]));
  const adminSet = new Set<string>((admins.data ?? []).map((r: any) => (typeof r === 'string' ? r : r.admin_ids ?? r.user_id)));
  // Replies from the team account show the site name and logo, not the personal profile
  const actorOf = new Map((actors.data ?? []).map((a: any) => [a.id,
    adminSet.has(a.id) ? { display_name: 'Trekking Partners Nepal Admin', avatar_url: '/web-app-manifest-192x192.png', team: true } : a]));

  return data
    // reply notices for a post that no longer exists aren't useful
    .filter((n) => !(n.kind === 'reply' || n.kind === 'thread_reply') || trekOf.has(n.trip_id))
    // …and the same for questions that were deleted
    .filter((n) => !QUESTION_KINDS.includes(n.kind) || questionOf.has(n.question_id))
    .map((n) => QUESTION_KINDS.includes(n.kind)
      ? describeQuestion(n as Notice, questionOf.get(n.question_id)!, n.actor_id ? actorOf.get(n.actor_id) : undefined)
      : describe(n as Notice, n.trip_id ? trekOf.get(n.trip_id) : undefined, n.actor_id ? actorOf.get(n.actor_id) : undefined));
}

const clip = (t: string, n = 60) => (t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t);

function describeQuestion(n: Notice, q: { id: string; title: string; trek: string }, actor?: { display_name: string | null; avatar_url: string | null; team?: boolean }): NoticeView {
  const who = (actor?.team ? actor.display_name : actor?.display_name?.split(' ')[0]) || 'A trekker';
  const url = `/community/question/?id=${encodeURIComponent(q.id)}`;
  const title = `“${clip(q.title)}”`;
  switch (n.kind) {
    case 'answer':
      return { ...n, icon: '💬', strong: n.count > 1 ? `${n.count} new answers` : who,
        text: n.count > 1 ? ` to your question ${title} · latest from ${who}` : ` answered your question ${title}`,
        href: url + '#answers', actorAvatar: actor?.avatar_url ?? null };
    case 'thread_answer':
      return { ...n, icon: '💬', strong: n.count > 1 ? `${n.count} new answers` : who,
        text: n.count > 1 ? ` on ${title}, which you answered · latest from ${who}` : ` also answered ${title}`,
        href: url + '#answers', actorAvatar: actor?.avatar_url ?? null };
    case 'best_answer':
      return { ...n, icon: '✅', strong: 'Your answer was marked best',
        text: ` on ${title}. Thanks for helping a fellow trekker!`,
        href: url + '#answers', actorAvatar: null };
    default: {
      const trek = getTrek(q.trek);
      return { ...n, icon: '↪', strong: 'Your question looks like a partner request.',
        text: ` The Community is for trek questions, so we moved ${title} out. Post your dates on Find partners so other trekkers can join you.`,
        href: trek ? `/find-partners/new/?trek=${encodeURIComponent(trek.slug)}` : '/find-partners/new/', actorAvatar: null };
    }
  }
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

/** Opening a Community question marks its answer notifications as read. */
export async function markQuestionRead(userId: string, questionId: string) {
  await supabase.from('notifications').update({ read_at: now() })
    .eq('user_id', userId).eq('question_id', questionId).neq('kind', 'moved_to_partners').is('read_at', null);
}

/** Calls `onChange` whenever this user gets a new or updated notification. Returns an unsubscribe function. */
export function watchNotices(userId: string, onChange: () => void) {
  const ch = supabase
    .channel(`notices-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, onChange)
    .subscribe();
  return () => { supabase.removeChannel(ch); };
}

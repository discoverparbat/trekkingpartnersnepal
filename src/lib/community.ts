// Community: trek questions, answers and admin trail notes (browser only).
// All user text is inserted with textContent, never as HTML.
import { supabase } from './supabase';
import { el, avatar, authorName, authorFacts, timeAgo, type Author } from './posts';
import { getTrek } from '../data/treks';
import { getRegion } from '../data/regions';
import { GENERAL, GENERAL_LABEL, topicLabel, noteLabel } from '../data/community';

export interface Question {
  id: string;
  user_id: string;
  trek: string;
  region: string | null;
  topic: string;
  title: string;
  body: string;
  status: 'open' | 'closed' | 'moved';
  pinned: boolean;
  best_answer_id: string | null;
  answers_count: number;
  last_activity_at: string;
  created_at: string;
  author?: Author;
}

export interface Answer {
  id: string;
  question_id: string;
  user_id: string;
  body: string;
  edited_at: string | null;
  created_at: string;
  author?: Author;
  helpful: number;
}

export interface Note {
  id: string;
  kind: string;
  headline: string | null;
  body: string;
  expires_at: string | null;
  created_at: string;
}

const Q_COLS = 'id, user_id, trek, region, topic, title, body, status, pinned, best_answer_id, answers_count, last_activity_at, created_at';
const AUTHOR_COLS = 'id, display_name, avatar_url, nationality, gender, age';

export const questionUrl = (id: string) => `/community/question/?id=${encodeURIComponent(id)}`;
export const trekName = (slug: string) => (slug === GENERAL ? GENERAL_LABEL : getTrek(slug)?.name ?? slug);
export function trekUrl(slug: string) {
  const t = getTrek(slug);
  return t ? `/${t.region}/${t.slug}/` : null;
}
export const regionName = (slug: string | null) => (slug ? getRegion(slug)?.name ?? '' : '');

// ── Team account ────────────────────────────────────────────
let adminIdsPromise: Promise<Set<string>> | null = null;
/** Ids of admin accounts. Their answers show the site name and logo, not the personal profile. */
export function adminIds(): Promise<Set<string>> {
  adminIdsPromise ??= Promise.resolve(supabase.rpc('admin_ids'))
    .then(({ data }) => new Set<string>((data ?? []).map((r: any) => (typeof r === 'string' ? r : r.admin_ids ?? r.user_id))))
    .catch(() => new Set<string>());
  return adminIdsPromise;
}

export async function amIAdmin() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  const { data } = await supabase.rpc('is_admin');
  return !!data;
}

async function authors(ids: string[]) {
  const unique = [...new Set(ids)];
  if (!unique.length) return new Map<string, Author>();
  const { data } = await supabase.from('public_profiles').select(AUTHOR_COLS).in('id', unique);
  return new Map((data ?? []).map((a: Author) => [a.id, a]));
}

// ── Loading ─────────────────────────────────────────────────
export async function fetchQuestions(opts: { limit?: number; trek?: string } = {}): Promise<Question[]> {
  let q = supabase.from('questions').select(Q_COLS).neq('status', 'moved')
    .order('pinned', { ascending: false }).order('last_activity_at', { ascending: false });
  if (opts.trek) q = q.eq('trek', opts.trek);
  q = q.limit(opts.limit ?? 300);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Question[];
  const byId = await authors(rows.map((r) => r.user_id));
  return rows.map((r) => ({ ...r, author: byId.get(r.user_id) }));
}

export async function fetchQuestion(id: string): Promise<Question | null> {
  const { data, error } = await supabase.from('questions').select(Q_COLS).eq('id', id).maybeSingle();
  if (error || !data) return null;
  const byId = await authors([data.user_id]);
  return { ...(data as Question), author: byId.get(data.user_id) };
}

export async function fetchAnswers(questionId: string): Promise<Answer[]> {
  const { data, error } = await supabase.from('answers')
    .select('id, question_id, user_id, body, edited_at, created_at')
    .eq('question_id', questionId).order('created_at', { ascending: true });
  if (error || !data?.length) return [];
  const ids = data.map((a) => a.id);
  const [byId, votes] = await Promise.all([
    authors(data.map((a) => a.user_id)),
    supabase.from('answer_vote_counts').select('answer_id, helpful').in('answer_id', ids),
  ]);
  const helpful = new Map((votes.data ?? []).map((v: any) => [v.answer_id, v.helpful]));
  return data.map((a) => ({ ...(a as Answer), author: byId.get(a.user_id), helpful: helpful.get(a.id) ?? 0 }));
}

/** Answers this member already marked as helpful */
export async function myVotes(answerIds: string[]) {
  if (!answerIds.length) return new Set<string>();
  const { data } = await supabase.from('answer_votes').select('answer_id').in('answer_id', answerIds);
  return new Set((data ?? []).map((v: any) => v.answer_id as string));
}

export async function fetchNotes(limit = 10): Promise<Note[]> {
  const { data } = await supabase.from('admin_notes')
    .select('id, kind, headline, body, expires_at, created_at')
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false }).limit(limit);
  return (data ?? []) as Note[];
}

// ── Admin actions ───────────────────────────────────────────
async function updateQuestion(id: string, change: Partial<Pick<Question, 'pinned' | 'status' | 'best_answer_id'>>) {
  const { error } = await supabase.from('questions').update(change).eq('id', id);
  if (error) { alert('Could not save: ' + error.message); return false; }
  return true;
}

export const setPinned = (id: string, pinned: boolean) => updateQuestion(id, { pinned });
export const setStatus = (id: string, status: Question['status']) => updateQuestion(id, { status });
export const setBestAnswer = (id: string, answerId: string | null) => updateQuestion(id, { best_answer_id: answerId });

export async function moveToPartners(q: Pick<Question, 'id' | 'title'>) {
  if (!confirm(`Move “${q.title}” out of the Community?\n\nIt will be hidden here, and the member gets a notification asking them to post on Find partners instead.`)) return false;
  const ok = await setStatus(q.id, 'moved');
  if (ok) await supabase.from('reports').update({ status: 'resolved' }).eq('kind', 'question').eq('target_id', q.id).eq('status', 'open');
  return ok;
}

export async function deleteQuestion(q: Pick<Question, 'id'>) {
  if (!confirm('Delete this question and all its answers? This can’t be undone.')) return false;
  const { error } = await supabase.from('questions').delete().eq('id', q.id);
  if (error) { alert('Could not delete: ' + error.message); return false; }
  await supabase.from('reports').update({ status: 'resolved' }).eq('kind', 'question').eq('target_id', q.id).eq('status', 'open');
  return true;
}

// ── Building blocks ─────────────────────────────────────────
const CHAT_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>';

export const answersLabel = (n: number) => (n === 0 ? 'No answers yet' : n === 1 ? '1 answer' : `${n} answers`);

function chips(q: Question) {
  const meta = el('div', 'q-meta');
  meta.append(el('span', 'q-trek', trekName(q.trek)), el('span', 'q-topic', topicLabel(q.topic)));
  if (q.pinned) meta.append(el('span', 'q-flag q-pinned', '📌 Pinned'));
  if (q.status === 'closed') meta.append(el('span', 'q-flag q-closed', 'Closed'));
  return meta;
}

export function byline(a: Author | undefined, userId: string, team: boolean, when: string) {
  const line = el('div', 'q-by');
  if (team) {
    const img = el('img', 'avatar');
    img.src = '/web-app-manifest-192x192.png'; img.alt = ''; img.width = 22; img.height = 22;
    line.append(img, el('span', 'q-by-name', 'Trekking Partners Nepal'), el('span', 'admin-tag', 'Admin'));
  } else {
    line.append(avatar(a, 22));
    const name = el('a', 'q-by-name', authorName(a));
    name.href = `/trekker/?id=${encodeURIComponent(userId)}`;
    line.append(name);
    if (a?.nationality) line.append(el('span', '', a.nationality));
  }
  line.append(el('span', 'q-dot', '·'), el('span', '', when));
  return line;
}

export interface CardOptions {
  admin?: boolean;
  team?: Set<string>;
  onChange?: () => void;     // called after an admin action
}

/** A question in the Community list. Answer count sits at the bottom. */
export function questionCard(q: Question, o: CardOptions = {}) {
  const card = el('article', 'q-card' + (q.pinned ? ' is-pinned' : ''));
  const h = el('h3', 'q-title');
  const link = el('a', '', q.title);
  link.href = questionUrl(q.id);
  h.append(link);
  card.append(chips(q), h, el('p', 'q-excerpt', q.body));
  card.append(byline(q.author, q.user_id, !!o.team?.has(q.user_id), 'asked ' + timeAgo(q.created_at)));

  const foot = el('div', 'q-foot');
  const count = el('span', q.answers_count ? 'q-count' : 'q-count none');
  count.innerHTML = CHAT_ICON;   // fixed icon, no user text
  count.append(answersLabel(q.answers_count));
  foot.append(count);
  if (q.best_answer_id) foot.append(el('span', 'q-answered', '✓ Answered'));
  if (q.answers_count) foot.append(el('span', 'q-ago', 'active ' + timeAgo(q.last_activity_at)));
  const go = el('a', 'q-go', q.status === 'open' && !q.answers_count ? 'Answer →' : 'Read answers →');
  go.href = questionUrl(q.id) + (q.status === 'open' && !q.answers_count ? '#answer' : '');
  foot.append(go);
  card.append(foot);

  if (o.admin) card.append(adminRow(q, o.onChange ?? (() => location.reload())));
  return card;
}

/** Pin / Close / Move / Delete buttons for admins */
export function adminRow(q: Question, done: () => void) {
  const row = el('div', 'q-mod');
  const b = (label: string, cls: string, fn: () => Promise<boolean>) => {
    const x = el('button', cls, label);
    x.type = 'button';
    x.addEventListener('click', async () => { x.disabled = true; if (await fn()) done(); x.disabled = false; });
    row.append(x);
  };
  row.append(el('span', 'q-mod-label', 'Admin'));
  b(q.pinned ? 'Unpin' : 'Pin to top', '', () => setPinned(q.id, !q.pinned));
  b(q.status === 'closed' ? 'Reopen answers' : 'Close answers', '', () => setStatus(q.id, q.status === 'closed' ? 'open' : 'closed'));
  b('↪ Move to Find partners', 'move', () => moveToPartners(q));
  b('Delete', 'danger', () => deleteQuestion(q));
  return row;
}

/** One admin note: coloured tag, optional bold headline, text and time */
export function noteRow(n: Note, onDelete?: (n: Note) => void) {
  const row = el('div', 'note');
  row.append(el('span', `note-tag nt-${n.kind}`, noteLabel(n.kind)));
  const text = el('p');
  if (n.headline) text.append(el('strong', '', n.headline + ': '));
  text.append(n.body);
  const small = el('small', '', timeAgo(n.created_at));
  if (onDelete) {
    if (n.expires_at) small.append(` · until ${new Date(n.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`);
    const del = el('button', 'note-del', 'Delete');
    del.type = 'button';
    del.addEventListener('click', () => onDelete(n));
    small.append(' · ', del);
  }
  row.append(text, small);
  return row;
}

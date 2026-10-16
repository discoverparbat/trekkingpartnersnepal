// Admin → Moderation tab: reports, recent posts and replies, members (browser only).
// All user text is inserted with textContent, never as HTML.
import { supabase } from './supabase';
import { el, timeAgo } from './posts';
import { getTrek } from '../data/treks';

type Toast = (msg: string) => void;

interface Member {
  id: string; display_name: string | null; avatar_url: string | null; nationality: string | null;
  email: string | null; created_at: string; posts: number; replies: number; banned: boolean; complete: boolean;
}

const REASON: Record<string, string> = {
  spam: 'Spam / advertising', scam: 'Scam / fake / money', harassment: 'Harassment / offensive',
  unsafe: 'Unsafe', other: 'Other',
};
const KIND: Record<string, string> = { post: 'Post', reply: 'Reply', profile: 'Trekker' };

let toast: Toast = () => {};
let members = new Map<string, Member>();
let reportFilter: 'open' | 'all' = 'open';
let myId = '';

const $ = (id: string) => document.getElementById(id)!;
const nameOf = (id: string) => members.get(id)?.display_name || 'Trekker';
const short = (t: string, n = 160) => (t.length > n ? t.slice(0, n - 1) + '…' : t);
const postUrl = (id: string) => `/post/?id=${encodeURIComponent(id)}`;
const trekkerUrl = (id: string) => `/trekker/?id=${encodeURIComponent(id)}`;

function link(text: string, href: string, cls = '') {
  const a = el('a', cls, text);
  a.href = href; a.target = '_blank'; a.rel = 'noopener';
  return a;
}

function btn(label: string, onClick: () => void, cls = '') {
  const b = el('button', cls, label);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

// ── Actions ─────────────────────────────────────────────────
async function deleteContent(kind: 'post' | 'reply', id: string) {
  const { error } = await supabase.from(kind === 'post' ? 'trips' : 'comments').delete().eq('id', id);
  if (error) { toast('Error: ' + error.message); return false; }
  // close every open report about this item
  await supabase.from('reports').update({ status: 'resolved' }).eq('kind', kind).eq('target_id', id).eq('status', 'open');
  return true;
}

async function ban(userId: string) {
  const name = nameOf(userId);
  if (!confirm(`Ban ${name}? They will no longer be able to post, reply or read replies.`)) return;
  const reason = prompt('Reason (only you see this):', 'Broke the rules') ?? '';
  const { error } = await supabase.from('bans').upsert({ user_id: userId, reason: reason.slice(0, 300) || null });
  if (error) return toast('Error: ' + error.message);
  if (confirm(`Also delete all of ${name}’s posts and replies?`)) {
    await supabase.from('comments').delete().eq('user_id', userId);
    await supabase.from('trips').delete().eq('user_id', userId);
  }
  await supabase.from('reports').update({ status: 'resolved' }).eq('kind', 'profile').eq('target_id', userId).eq('status', 'open');
  toast(`${name} is banned`);
  refresh();
}

async function unban(userId: string) {
  if (!confirm(`Lift the ban on ${nameOf(userId)}?`)) return;
  const { error } = await supabase.from('bans').delete().eq('user_id', userId);
  if (error) return toast('Error: ' + error.message);
  toast('Ban lifted');
  refresh();
}

async function setReport(id: string, status: 'resolved' | 'dismissed' | 'open') {
  const { error } = await supabase.from('reports').update({ status }).eq('id', id);
  if (error) return toast('Error: ' + error.message);
  toast(status === 'open' ? 'Report reopened' : status === 'dismissed' ? 'Report dismissed' : 'Marked as resolved');
  loadReports();
}

// ── Reports ─────────────────────────────────────────────────
async function loadReports() {
  let q = supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(100);
  if (reportFilter === 'open') q = q.eq('status', 'open');
  const { data: reports, error } = await q;
  if (error) { toast('Could not load reports: ' + error.message); return; }
  const list = reports ?? [];

  const postIds = list.filter((r) => r.kind === 'post').map((r) => r.target_id);
  const replyIds = list.filter((r) => r.kind === 'reply').map((r) => r.target_id);
  const [posts, replies] = await Promise.all([
    postIds.length ? supabase.from('trips').select('id, user_id, trek, description').in('id', postIds) : { data: [] },
    replyIds.length ? supabase.from('comments').select('id, user_id, trip_id, body').in('id', replyIds) : { data: [] },
  ]);
  const postById = new Map((posts.data ?? []).map((p: any) => [p.id, p]));
  const replyById = new Map((replies.data ?? []).map((c: any) => [c.id, c]));

  const { count } = await supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open');
  const badge = $('open-count');
  badge.textContent = String(count ?? 0);
  badge.hidden = !count;

  $('none-reports').hidden = list.length > 0;
  $('none-reports').textContent = reportFilter === 'open' ? 'No open reports. 🎉' : 'No reports yet.';
  $('report-list').replaceChildren(...list.map((r) => {
    const card = el('div', `mod-card status-${r.status}`);
    const head = el('div', 'mod-head');
    head.append(el('span', 'tag', KIND[r.kind] ?? r.kind), el('strong', '', REASON[r.reason] ?? r.reason));
    if (r.status !== 'open') head.append(el('span', 'tag off', r.status === 'resolved' ? 'Resolved' : 'Dismissed'));
    head.append(el('span', 'mod-when', `${timeAgo(r.created_at)} · by ${nameOf(r.reporter_id)}`));
    card.append(head);
    if (r.details) card.append(el('p', 'mod-details', '“' + r.details + '”'));

    // What was reported
    const target = el('div', 'mod-target');
    const actions = el('div', 'mod-actions');
    let authorId: string | null = null;
    if (r.kind === 'post') {
      const p = postById.get(r.target_id);
      if (p) {
        authorId = p.user_id;
        target.append(el('div', 'mod-title', `${getTrek(p.trek)?.name ?? p.trek} · ${nameOf(p.user_id)}`), el('p', '', short(p.description)));
        actions.append(link('View post', postUrl(p.id), 'mod-link'));
        actions.append(btn('Delete post', async () => {
          if (confirm('Delete this post and its replies?') && await deleteContent('post', p.id)) { toast('Post deleted'); refresh(); }
        }, 'danger'));
      } else target.append(el('p', 'muted', 'This post has already been deleted.'));
    } else if (r.kind === 'reply') {
      const c = replyById.get(r.target_id);
      if (c) {
        authorId = c.user_id;
        target.append(el('div', 'mod-title', `Reply by ${nameOf(c.user_id)}`), el('p', '', short(c.body)));
        actions.append(link('View post', postUrl(c.trip_id), 'mod-link'));
        actions.append(btn('Delete reply', async () => {
          if (confirm('Delete this reply?') && await deleteContent('reply', c.id)) { toast('Reply deleted'); refresh(); }
        }, 'danger'));
      } else target.append(el('p', 'muted', 'This reply has already been deleted.'));
    } else {
      authorId = r.target_id;
      const m = members.get(r.target_id);
      target.append(el('div', 'mod-title', m ? `${nameOf(m.id)}${m.email ? ' · ' + m.email : ''}` : 'Trekker'));
      actions.append(link('View profile', trekkerUrl(r.target_id), 'mod-link'));
    }
    if (authorId && authorId !== myId) {
      const m = members.get(authorId);
      if (m?.banned) actions.append(el('span', 'tag full', 'Banned'));
      else actions.append(btn(`Ban ${nameOf(authorId)}`, () => ban(authorId!), 'danger'));
    }
    if (r.status === 'open') {
      actions.append(btn('Dismiss', () => setReport(r.id, 'dismissed')), btn('Mark resolved', () => setReport(r.id, 'resolved')));
    } else {
      actions.append(btn('Reopen', () => setReport(r.id, 'open')));
    }
    card.append(target, actions);
    return card;
  }));
}

// ── Recent posts and replies ───────────────────────────────
async function loadRecent() {
  const [posts, replies] = await Promise.all([
    supabase.from('trips').select('id, user_id, trek, description, status, created_at').order('created_at', { ascending: false }).limit(25),
    supabase.from('comments').select('id, user_id, trip_id, body, created_at').order('created_at', { ascending: false }).limit(25),
  ]);

  $('recent-posts').replaceChildren(...(posts.data ?? []).map((p: any) => {
    const tr = document.createElement('tr');
    const text = el('td', 'mod-text');
    text.append(el('strong', '', getTrek(p.trek)?.name ?? p.trek), el('div', 'muted', short(p.description, 120)));
    const actions = el('td', 'actions');
    actions.append(link('View', postUrl(p.id)), btn('Delete', async () => {
      if (confirm('Delete this post and its replies?') && await deleteContent('post', p.id)) { toast('Post deleted'); refresh(); }
    }, 'danger'));
    tr.append(el('td', 'nowrap', timeAgo(p.created_at)), el('td', '', nameOf(p.user_id)), text, actions);
    return tr;
  }));
  $('none-posts').hidden = (posts.data ?? []).length > 0;

  $('recent-replies').replaceChildren(...(replies.data ?? []).map((c: any) => {
    const tr = document.createElement('tr');
    const actions = el('td', 'actions');
    actions.append(link('View', postUrl(c.trip_id)), btn('Delete', async () => {
      if (confirm('Delete this reply?') && await deleteContent('reply', c.id)) { toast('Reply deleted'); refresh(); }
    }, 'danger'));
    tr.append(el('td', 'nowrap', timeAgo(c.created_at)), el('td', '', nameOf(c.user_id)), el('td', 'mod-text', short(c.body, 140)), actions);
    return tr;
  }));
  $('none-replies').hidden = (replies.data ?? []).length > 0;
}

// ── Members ────────────────────────────────────────────────
async function loadMembers() {
  const { data, error } = await supabase.rpc('admin_members');
  if (error) { toast('Could not load members: ' + error.message); return; }
  members = new Map((data ?? []).map((m: Member) => [m.id, m]));
  renderMembers();
}

function renderMembers() {
  const q = (($('member-search') as HTMLInputElement).value || '').trim().toLowerCase();
  const all = [...members.values()];
  const shown = all.filter((m) => !q || [m.display_name, m.email, m.nationality].some((v) => v?.toLowerCase().includes(q)));
  $('member-count').textContent = `${all.length} members`;
  $('members').replaceChildren(...shown.map((m) => {
    const tr = document.createElement('tr');
    if (m.banned) tr.className = 'hidden-row';
    const name = el('td');
    name.append(link(m.display_name || '(no name yet)', trekkerUrl(m.id)));
    if (!m.complete) name.append(' ', el('span', 'tag off', 'Profile incomplete'));
    if (m.banned) name.append(' ', el('span', 'tag full', 'Banned'));
    const actions = el('td', 'actions');
    if (m.id !== myId) actions.append(m.banned ? btn('Unban', () => unban(m.id)) : btn('Ban', () => ban(m.id), 'danger'));
    tr.append(name, el('td', '', m.email ?? ''), el('td', '', m.nationality ?? ''),
      el('td', 'nowrap', new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })),
      el('td', '', `${m.posts} / ${m.replies}`), actions);
    return tr;
  }));
}

async function refresh() {
  await loadMembers();
  await Promise.all([loadReports(), loadRecent()]);
}

let started = false;
export async function initModeration(t: Toast) {
  toast = t;
  myId = (await supabase.auth.getSession()).data.session?.user.id ?? '';
  if (!started) {
    started = true;
    $('member-search').addEventListener('input', renderMembers);
    document.querySelectorAll<HTMLButtonElement>('[data-report-filter]').forEach((b) =>
      b.addEventListener('click', () => {
        reportFilter = b.dataset.reportFilter as 'open' | 'all';
        document.querySelectorAll('[data-report-filter]').forEach((x) => x.classList.toggle('on', x === b));
        loadReports();
      }));
  }
  return refresh();
}

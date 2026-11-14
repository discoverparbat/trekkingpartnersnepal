// Supabase Edge Function: push-send
// Shows Trekking Partners Nepal notifications on members' phones and computers (Web Push),
// like app notifications – on the lock screen / notification centre, even when the site is closed.
//
// Called by the database (supabase/update-28-push.sql) with one of:
//   { notification_id }  – every new 🔔 bell notification (and every grouped "3 new replies" update)
//   { message_id }       – every new private message
// Sends to every device the member turned notifications on for (table push_subscriptions).
// Secrets: VAPID_PRIVATE_KEY (and optionally VAPID_PUBLIC_KEY). JWT verification OFF – it checks x-alert-secret.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendPush, type Vapid } from './webpush.ts';

const VAPID: Vapid = {
  publicKey: Deno.env.get('VAPID_PUBLIC_KEY') ?? 'BGuCdVwMthQqaS8TicEdNmzIyv96wsJdo50OujQHx2o3Gqx11WA3rOPylaRlAQENQkz-4RYK06Q_kVQoAVbp6-U',
  privateKey: Deno.env.get('VAPID_PRIVATE_KEY') ?? '',
  subject: 'mailto:hello@trekkingpartnersnepal.com',
};

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

interface Push {
  title: string;
  body: string;
  url: string;     // on-site path opened when the notification is tapped
  tag: string;     // a newer notification with the same tag replaces the older one on the device
  urgency?: 'normal' | 'high';
  topic?: string;
}

const trekName = (slug: string) => slug.split('-').map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');
const clip = (t: string, n = 80) => (t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t);
const first = (name?: string | null) => (name || 'A trekker').split(' ')[0];
const safeLink = (l?: string | null) => (l && l.startsWith('/') && !l.startsWith('//') ? l : '/');

async function actorName(id: string | null): Promise<string> {
  if (!id) return 'A trekker';
  const [{ data: admin }, { data: p }] = await Promise.all([
    db.from('admins').select('user_id').eq('user_id', id).maybeSingle(),
    db.from('profiles').select('display_name').eq('id', id).maybeSingle(),
  ]);
  return admin ? 'Trekking Partners Nepal' : first(p?.display_name);
}

/** The same wording as the bell (src/lib/notifications.ts), shortened for a phone notification. */
async function fromNotification(id: string): Promise<{ user: string; push: Push } | null> {
  const { data: n } = await db.from('notifications').select('*').eq('id', id).maybeSingle();
  if (!n || n.read_at) return null;
  const who = await actorName(n.actor_id);

  let trek = '';
  if (n.trip_id) {
    const { data: t } = await db.from('trips').select('trek').eq('id', n.trip_id).maybeSingle();
    if (!t && (n.kind === 'reply' || n.kind === 'thread_reply')) return null;   // post deleted
    if (t) trek = trekName(t.trek);
  }
  let q: { id: string; title: string; trek: string } | null = null;
  if (n.question_id) {
    const { data } = await db.from('questions').select('id, title, trek').eq('id', n.question_id).maybeSingle();
    q = data;
  }
  const post = n.trip_id ? `/post/?id=${n.trip_id}` : '/account/';
  const qUrl = q ? `/community/question/?id=${q.id}` : '/community/';
  const qTitle = q ? `“${clip(q.title, 70)}”` : 'your question';
  const many = n.count > 1;
  const tag = n.trip_id ? `post-${n.trip_id}` : n.question_id ? `q-${n.question_id}` : `n-${n.id}`;

  let p: Omit<Push, 'tag'>;
  switch (n.kind) {
    case 'welcome':
      p = { title: 'Welcome to Trekking Partners Nepal! 👋', body: 'Complete your profile, then post your trek or browse partner posts.', url: '/account/' };
      break;
    case 'first_post':
      p = { title: trek ? `Your ${trek} post is live 🎉` : 'Your first post is live 🎉', body: 'Share it on WhatsApp or Facebook to find partners faster.', url: post };
      break;
    case 'reply':
      p = { title: many ? `${n.count} new replies on your ${trek} post` : `${who} replied to your ${trek} post`,
            body: many ? `Latest from ${who}. Tap to read.` : 'Tap to read the reply.', url: post + '#replies', urgency: 'high' };
      break;
    case 'thread_reply':
      p = { title: many ? `${n.count} new replies on the ${trek} post` : `${who} also replied on the ${trek} post`,
            body: many ? `Latest from ${who}. You replied there too.` : 'You replied there too. Tap to read.', url: post + '#replies' };
      break;
    case 'answer':
      p = { title: many ? `${n.count} new answers to your question` : `${who} answered your question`, body: qTitle, url: qUrl + '#answers', urgency: 'high' };
      break;
    case 'thread_answer':
      p = { title: many ? `${n.count} new answers` : `${who} also answered`, body: qTitle, url: qUrl + '#answers' };
      break;
    case 'best_answer':
      p = { title: 'Your answer was marked best ✅', body: `${qTitle} – thanks for helping a fellow trekker!`, url: qUrl + '#answers' };
      break;
    case 'new_question':
      p = { title: `🙋 New question from ${who}`, body: qTitle, url: qUrl + '#answer' };
      break;
    case 'moved_to_partners':
      p = { title: 'Your question looks like a partner request', body: 'Post your dates on Find partners so other trekkers can join you.',
            url: q ? `/find-partners/new/?trek=${encodeURIComponent(q.trek)}` : '/find-partners/new/' };
      break;
    case 'message_invite':
    case 'message_ready':
      p = { title: n.kind === 'message_ready' ? `${who} turned on messages` : `${who} wants to message you`,
            body: trek ? `About ${trek}. Tap to open Messages.` : 'Tap to open Messages.',
            url: n.conversation_id ? `/messages/?c=${n.conversation_id}` : '/messages/' };
      break;
    case 'admin_alert':
      p = { title: `⚠️ ${n.title || 'Admin alert'}`, body: n.body || '', url: safeLink(n.link) };
      break;
    case 'announcement':
    default:
      p = { title: n.title || 'News from Trekking Partners Nepal', body: n.body || '', url: safeLink(n.link) };
  }
  return { user: n.user_id, push: { ...p, tag } };
}

async function fromMessage(id: string): Promise<{ user: string; push: Push } | null> {
  const { data: m } = await db.from('messages').select('id, conversation_id, sender_id, body, created_at').eq('id', id).maybeSingle();
  if (!m) return null;
  const { data: c } = await db.from('conversations').select('*').eq('id', m.conversation_id).maybeSingle();
  if (!c) return null;
  const recipient = c.user_a === m.sender_id ? c.user_b : c.user_a;
  const theirRead = c.user_a === recipient ? c.a_read_at : c.b_read_at;
  // They're reading this chat right now (the page marks it read as messages arrive) – no need to buzz
  if (theirRead && Date.now() - new Date(theirRead).getTime() < 30_000) return null;
  const { data: blocked } = await db.rpc('is_message_blocked', { x: c.user_a, y: c.user_b });
  if (blocked) return null;

  const who = await actorName(m.sender_id);
  const text = m.body ? clip(m.body.replace(/\s+/g, ' ').trim(), 120) : 'Sent you a message';
  return {
    user: recipient,
    push: {
      title: who, body: text, url: `/messages/?c=${c.id}`,
      tag: `chat-${c.id}`, urgency: 'high', topic: String(c.id).replace(/-/g, ''),   // 32 chars, the maximum
    },
  };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok');
  const secret = req.headers.get('x-alert-secret') ?? '';
  const { data: ok } = await db.rpc('check_alert_secret', { s: secret });
  if (!ok) return new Response('forbidden', { status: 403 });
  if (!VAPID.privateKey) return new Response('VAPID_PRIVATE_KEY not set', { status: 500 });

  const { notification_id, message_id } = await req.json().catch(() => ({}));
  const built = notification_id ? await fromNotification(notification_id) : message_id ? await fromMessage(message_id) : null;
  if (!built) return new Response('nothing to send');

  const [{ data: ban }, { data: subs }] = await Promise.all([
    db.from('bans').select('user_id').eq('user_id', built.user).maybeSingle(),
    db.from('push_subscriptions').select('endpoint, p256dh, auth').eq('user_id', built.user),
  ]);
  if (ban || !subs?.length) return new Response('no devices');

  const { urgency, topic, ...payload } = built.push;
  let sent = 0;
  const gone: string[] = [];
  await Promise.all(subs.map(async (s) => {
    try {
      const status = await sendPush(s, payload, VAPID, { urgency: urgency ?? 'normal', topic, ttl: 3 * 86400 });
      if (status === 404 || status === 410) gone.push(s.endpoint);       // phone unsubscribed / app removed
      else if (status >= 200 && status < 300) sent++;
    } catch (e) {
      console.error('push failed', String(e));
    }
  }));
  if (gone.length) await db.from('push_subscriptions').delete().in('endpoint', gone);
  return new Response(JSON.stringify({ sent, removed: gone.length }), { headers: { 'Content-Type': 'application/json' } });
});

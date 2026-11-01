// Supabase Edge Function: message-alert
// Emails a member when someone messages them on Trekking Partners Nepal.
//   type "message": a new message (the database already throttles this to one email per chat every 3 hours)
//   type "invite":  only used before update 24 (when members had to set up messages first)
// The email never contains the message text – only who wrote – so chats stay on the site.
// Called by the database triggers in supabase/update-22-messages.sql. Uses the RESEND_API_KEY secret.
import { createClient } from 'npm:@supabase/supabase-js@2';

const SITE = 'https://trekkingpartnersnepal.com';
const FROM = 'Trekking Partners Nepal <alerts@trekkingpartnersnepal.com>';
const REPLY_TO = 'hello@trekkingpartnersnepal.com';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const trekName = (slug: string) => slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
const p = (html: string) => `<p style="margin:0 0 14px;font-size:16px;line-height:1.5">${html}</p>`;
const button = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#f0712c;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px">${label}</a>`;

function shell(body: string, footer: string) {
  return `<!doctype html><html><body style="margin:0;background:#f2f8ff;font-family:Arial,Helvetica,sans-serif;color:#0f1d33">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f8ff;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #d6e3f3;border-radius:14px">
<tr><td style="background:#081634;color:#ffffff;padding:18px 24px;border-radius:14px 14px 0 0;font-weight:bold;font-size:16px">Trekking Partners Nepal</td></tr>
<tr><td style="padding:24px">${body}</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #d6e3f3;font-size:12px;color:#55657d;line-height:1.5">${footer}</td></tr>
</table></td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok');

  // Only our own database may call this
  const secret = req.headers.get('x-alert-secret') ?? '';
  const { data: ok } = await db.rpc('check_alert_secret', { s: secret });
  if (!ok) return new Response('forbidden', { status: 403 });

  const { type, conversation_id, recipient, sender } = await req.json().catch(() => ({}));
  if (!conversation_id || !recipient || !sender || !['message', 'invite'].includes(type)) {
    return new Response('bad request', { status: 400 });
  }

  const [{ data: convo }, { data: people }, { data: u }, { data: ban }] = await Promise.all([
    db.from('conversations').select('id, trip_id').eq('id', conversation_id).maybeSingle(),
    db.from('profiles').select('id, display_name, email_replies, unsub_token').in('id', [recipient, sender]),
    db.auth.admin.getUserById(recipient),
    db.from('bans').select('user_id').eq('user_id', recipient).maybeSingle(),
  ]);
  const to = u?.user?.email;
  const me = (people ?? []).find((x) => x.id === recipient);
  const them = (people ?? []).find((x) => x.id === sender);
  if (!convo || !to || ban || !me?.email_replies) return new Response('nothing to send');

  const name = (me.display_name || 'trekker').split(' ')[0];
  const who = (them?.display_name || 'A trekker').split(' ')[0];
  let trek = '';
  if (convo.trip_id) {
    const { data: trip } = await db.from('trips').select('trek').eq('id', convo.trip_id).maybeSingle();
    if (trip) trek = trekName(trip.trek);
  }
  const chatUrl = `${SITE}/messages/?c=${conversation_id}`;
  const unsubUrl = `${SITE}/unsubscribe/?t=${me.unsub_token}`;
  const about = trek ? ` about your <strong>${esc(trek)}</strong> plans` : '';

  const subject = type === 'invite'
    ? `${who} wants to message you on Trekking Partners Nepal`
    : `${who} sent you a message`;
  const body = type === 'invite'
    ? p(`Hi ${esc(name)},`) +
      p(`<strong>${esc(who)}</strong> would like to message you${about}.`) +
      p(`Messages on Trekking Partners Nepal are private – only the two of you can read them. Open Messages to read and reply.`) +
      `<div style="margin:0 0 22px">${button(chatUrl, 'Open messages')}</div>`
    : p(`Hi ${esc(name)},`) +
      p(`<strong>${esc(who)}</strong> sent you a message${about}.`) +
      p(`<span style="color:#55657d;font-size:14px">For your privacy we don’t put messages in emails. Open the chat to read and reply.</span>`) +
      `<div style="margin:0 0 22px">${button(chatUrl, 'Read message')}</div>`;
  const html = shell(
    body + p(`<span style="font-size:14px;color:#55657d">Meeting a new trekking partner? Meet in a public place first and read our <a href="${SITE}/safety/" style="color:#1a72bd">safety tips</a>.</span>`),
    `You get this because someone messaged you on Trekking Partners Nepal. We send at most one email per chat every few hours.<br>
<a href="${unsubUrl}" style="color:#55657d">Turn off reply and message emails</a>`,
  );

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM, to: [to], reply_to: REPLY_TO, subject, html,
      headers: { 'List-Unsubscribe': `<${unsubUrl}>, <mailto:${REPLY_TO}?subject=unsubscribe>` },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('Resend error', res.status, err);
    // Daily/monthly plan limit reached (not the short per-second rate limit) → 🔔 to admins
    if (res.status === 429 && /quota/i.test(err)) await db.rpc('flag_email_limit');
    return new Response('send failed', { status: 502 });
  }
  return new Response(JSON.stringify({ sent: 1 }), { headers: { 'Content-Type': 'application/json' } });
});

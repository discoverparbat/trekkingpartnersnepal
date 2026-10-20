// Supabase Edge Function: answer-alert
// Emails the asker when someone answers their Community question.
// Called by the database trigger in update-14-answer-emails.sql, once per new "answer" notification.
// While that notification is unread, more answers are added to it on the site and no new email is
// sent – so an asker gets at most one email until they come back and read the answers.
// Uses the same RESEND_API_KEY secret, alert secret and "reply emails" setting as reply-alert.
import { createClient } from 'npm:@supabase/supabase-js@2';

const SITE = 'https://trekkingpartnersnepal.com';
const FROM = 'Trekking Partners Nepal <alerts@trekkingpartnersnepal.com>';
const REPLY_TO = 'hello@trekkingpartnersnepal.com';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const short = (t: string, n = 320) => (t.length > n ? t.slice(0, n - 1) + '…' : t);
const clip = (t: string, n = 70) => (t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t);

function emailHtml(o: { name: string; answerer: string; title: string; excerpt: string; url: string; unsubUrl: string }) {
  return `<!doctype html><html><body style="margin:0;background:#f2f8ff;font-family:Arial,Helvetica,sans-serif;color:#0f1d33">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f8ff;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #d6e3f3;border-radius:14px">
<tr><td style="background:#081634;color:#ffffff;padding:18px 24px;border-radius:14px 14px 0 0;font-weight:bold;font-size:16px">Trekking Partners Nepal</td></tr>
<tr><td style="padding:24px">
<p style="margin:0 0 12px;font-size:16px">Hi ${esc(o.name)},</p>
<p style="margin:0 0 6px;font-size:16px;line-height:1.5"><strong>${esc(o.answerer)}</strong> answered your question:</p>
<p style="margin:0 0 16px;font-size:16px;line-height:1.4;font-weight:bold">“${esc(o.title)}”</p>
<div style="background:#f2f8ff;border-left:4px solid #2e8fdc;border-radius:8px;padding:12px 14px;margin:0 0 20px;font-size:15px;line-height:1.5;white-space:pre-wrap">${esc(o.excerpt)}</div>
<a href="${o.url}" style="display:inline-block;background:#f0712c;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px">Read the answer</a>
<p style="margin:22px 0 0;font-size:13px;color:#55657d;line-height:1.5">Did it solve your question? Mark it as the best answer, so other trekkers find it too.</p>
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #d6e3f3;font-size:12px;color:#55657d;line-height:1.5">
You get this because you asked a question in the Trekking Partners Nepal Community.
<a href="${o.unsubUrl}" style="color:#55657d">Turn off reply emails</a>
</td></tr></table></td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok');

  // Only our own database may call this
  const secret = req.headers.get('x-alert-secret') ?? '';
  const { data: ok } = await db.rpc('check_alert_secret', { s: secret });
  if (!ok) return new Response('forbidden', { status: 403 });

  const { notification_id } = await req.json().catch(() => ({}));
  if (!notification_id) return new Response('missing notification_id', { status: 400 });

  const { data: n } = await db.from('notifications')
    .select('id, user_id, kind, question_id, answer_id, actor_id').eq('id', notification_id).maybeSingle();
  if (!n || n.kind !== 'answer' || !n.question_id || !n.answer_id) return new Response('nothing to send');

  const [{ data: q }, { data: a }, { data: prof }, { data: ban }, { data: actor }, { data: adminRow }] = await Promise.all([
    db.from('questions').select('id, title, status').eq('id', n.question_id).maybeSingle(),
    db.from('answers').select('id, body').eq('id', n.answer_id).maybeSingle(),
    db.from('profiles').select('display_name, email_replies, unsub_token').eq('id', n.user_id).maybeSingle(),
    db.from('bans').select('user_id').eq('user_id', n.user_id).maybeSingle(),
    n.actor_id ? db.from('profiles').select('display_name').eq('id', n.actor_id).maybeSingle() : Promise.resolve({ data: null }),
    n.actor_id ? db.from('admins').select('user_id').eq('user_id', n.actor_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  if (!q || !a || q.status === 'moved') return new Response('question or answer gone');
  if (!prof?.email_replies || ban) return new Response('emails off');

  const { data: u } = await db.auth.admin.getUserById(n.user_id);
  const to = u?.user?.email;
  if (!to) return new Response('no recipient');

  // Answers from the team account show the site name, not the personal profile
  const answerer = adminRow ? 'Trekking Partners Nepal' : ((actor as any)?.display_name?.split(' ')[0] || 'A trekker');
  const unsubUrl = `${SITE}/unsubscribe/?t=${prof.unsub_token}`;
  const url = `${SITE}/community/question/?id=${q.id}#answers`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      reply_to: REPLY_TO,
      subject: `${answerer} answered: ${clip(q.title)}`,
      html: emailHtml({
        name: (prof.display_name || 'trekker').split(' ')[0],
        answerer, title: q.title, excerpt: short(a.body), url, unsubUrl,
      }),
      headers: { 'List-Unsubscribe': `<${unsubUrl}>, <mailto:${REPLY_TO}?subject=unsubscribe>` },
    }),
  });
  if (!res.ok) {
    console.error('Resend error', res.status, await res.text());
    return new Response('send failed', { status: 502 });
  }
  return new Response(JSON.stringify({ sent: 1 }), { headers: { 'Content-Type': 'application/json' } });
});

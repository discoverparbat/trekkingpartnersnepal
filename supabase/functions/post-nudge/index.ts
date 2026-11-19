// Supabase Edge Function: post-nudge (19 Nov 2026)
// One-off personal nudge to members whose open partner post has had no reply or message.
//   Same trek, other posts within ±7 days → "N other trekkers are doing X the same week"
//   No match yet → short tips (flexible dates, share the link, notifications)
// Called from SQL with net.http_post and the reply_alert_secret: body { "trip_ids": [...] } (all one owner).
// Re-checks every post at send time and skips any that got a reply in the meantime.
import { createClient } from 'npm:@supabase/supabase-js@2';

const SITE = 'https://trekkingpartnersnepal.com';
const FROM = 'Sameer at Trekking Partners Nepal <hello@trekkingpartnersnepal.com>';
const REPLY_TO = 'hello@trekkingpartnersnepal.com';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const trekName = (slug: string) => slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
const p = (html: string) => `<p style="margin:0 0 14px;font-size:16px;line-height:1.5">${html}</p>`;
const button = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#f0712c;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px">${label}</a>`;
const day = (d: string) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const addDays = (d: string, n: number) => new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);

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
  const { data: ok } = await db.rpc('check_alert_secret', { s: req.headers.get('x-alert-secret') ?? '' });
  if (!ok) return new Response('forbidden', { status: 403 });
  const { trip_ids } = await req.json().catch(() => ({}));
  if (!Array.isArray(trip_ids) || !trip_ids.length) return new Response('bad request', { status: 400 });

  const { data: trips } = await db.from('trips').select('id, user_id, trek, start_date, flexible, status').in('id', trip_ids);
  const owner = trips?.[0]?.user_id;
  if (!owner || trips!.some((t) => t.user_id !== owner)) return new Response('bad trips', { status: 400 });

  const [{ data: prof }, { data: u }, { data: ban }] = await Promise.all([
    db.from('profiles').select('display_name, email_replies, unsub_token').eq('id', owner).maybeSingle(),
    db.auth.admin.getUserById(owner),
    db.from('bans').select('user_id').eq('user_id', owner).maybeSingle(),
  ]);
  const to = u?.user?.email;
  if (!to || ban || !prof?.email_replies) return new Response('no recipient');

  // Still open, still no reply from anyone else, still no messages?
  const posts: { id: string; trek: string; start: string; flexible: boolean; matches: number }[] = [];
  for (const t of trips!) {
    if (t.status !== 'open') continue;
    const [{ count: c }, { data: convos }] = await Promise.all([
      db.from('comments').select('id', { count: 'exact', head: true }).eq('trip_id', t.id).neq('user_id', owner),
      db.from('conversations').select('id, last_message_at').eq('trip_id', t.id),
    ]);
    if ((c ?? 0) > 0 || (convos ?? []).some((v) => v.last_message_at)) continue;
    const { count: m } = await db.from('trips').select('id', { count: 'exact', head: true })
      .eq('trek', t.trek).eq('status', 'open').neq('user_id', owner)
      .gte('start_date', addDays(t.start_date, -7)).lte('start_date', addDays(t.start_date, 7));
    posts.push({ id: t.id, trek: trekName(t.trek), start: t.start_date, flexible: t.flexible, matches: m ?? 0 });
  }
  if (!posts.length) return new Response('nothing to nudge');

  const name = (prof.display_name || 'there').split(' ')[0];
  const best = posts.slice().sort((a, b) => b.matches - a.matches)[0];
  const url = `${SITE}/post/?id=${best.id}`;
  let subject: string, body: string;
  if (best.matches > 0) {
    const others = best.matches === 1 ? 'Another trekker is' : `${best.matches} other trekkers are`;
    subject = `${others} doing the ${best.trek} the same week as you`;
    body = p(`Hi ${esc(name)},`) +
      p(`Your <strong>${esc(best.trek)}</strong> post (from ${day(best.start)}) hasn’t had a reply yet – but ${best.matches === 1 ? 'another trekker has' : `${best.matches} other trekkers have`} posted for the same week.`) +
      p(`Open your post and you’ll see them under <strong>Similar posts</strong>. Message whoever fits – people who message first find partners much faster than people who wait.`) +
      `<div style="margin:0 0 22px">${button(url, 'Open my post')}</div>`;
  } else {
    const list = posts.map((x) => x.trek).join(' and ');
    subject = `Your ${list} post – a quick tip`;
    const tips = [
      ...(posts.some((x) => !x.flexible) ? [`<strong>Mark your dates as flexible</strong> if you can – it widens who can join you.`] : []),
      `<strong>Share your post link</strong> in a trekking group or two – shared posts get far more replies.`,
      `<strong>Turn on notifications</strong> on your post page so you see the first reply straight away.`,
    ];
    body = p(`Hi ${esc(name)},`) +
      p(`No one has replied to your <strong>${esc(list)}</strong> post${posts.length > 1 ? 's' : ''} yet. A few things that help:`) +
      `<ol style="margin:0 0 20px;padding-left:20px;font-size:15px;line-height:1.6">${tips.map((t) => `<li style="margin:0 0 6px">${t}</li>`).join('')}</ol>` +
      `<div style="margin:0 0 22px">${button(url, 'Open my post')}</div>`;
  }
  body += p(`– Sameer, Trekking Partners Nepal`);
  const unsubUrl = `${SITE}/unsubscribe/?t=${prof.unsub_token}`;
  const html = shell(body, `You get this because you posted a trek on Trekking Partners Nepal. Just reply if you have questions.<br><a href="${unsubUrl}" style="color:#55657d">Turn off these emails</a>`);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], reply_to: REPLY_TO, subject, html,
      headers: { 'List-Unsubscribe': `<${unsubUrl}>, <mailto:${REPLY_TO}?subject=unsubscribe>` } }),
  });
  if (!res.ok) { console.error('Resend error', res.status, await res.text()); return new Response('send failed', { status: 502 }); }
  return new Response(JSON.stringify({ sent: 1, subject }), { headers: { 'Content-Type': 'application/json' } });
});

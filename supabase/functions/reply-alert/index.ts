// Supabase Edge Function: reply-alert
// Emails the post owner and earlier repliers when someone new replies on a post.
// Called by the database trigger in update-5-reply-alerts.sql.
// Needs one secret: RESEND_API_KEY (Edge Functions → Secrets).
import { createClient } from 'npm:@supabase/supabase-js@2';

const SITE = 'https://trekkingpartnersnepal.com';
const FROM = 'Trekking Partners Nepal <alerts@trekkingpartnersnepal.com>';
const REPLY_TO = 'hello@trekkingpartnersnepal.com';
const QUIET_MINUTES = 30;   // at most one email per person per post every 30 minutes

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const trekName = (slug: string) => slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
const short = (t: string, n = 280) => (t.length > n ? t.slice(0, n - 1) + '…' : t);

function emailHtml(o: { name: string; replier: string; trek: string; excerpt: string; postUrl: string; unsubUrl: string; isOwner: boolean }) {
  const lead = o.isOwner
    ? `<strong>${esc(o.replier)}</strong> replied to your <strong>${esc(o.trek)}</strong> post.`
    : `<strong>${esc(o.replier)}</strong> also replied on the <strong>${esc(o.trek)}</strong> post you replied to.`;
  return `<!doctype html><html><body style="margin:0;background:#f2f8ff;font-family:Arial,Helvetica,sans-serif;color:#0f1d33">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f8ff;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #d6e3f3;border-radius:14px">
<tr><td style="background:#081634;color:#ffffff;padding:18px 24px;border-radius:14px 14px 0 0;font-weight:bold;font-size:16px">Trekking Partners Nepal</td></tr>
<tr><td style="padding:24px">
<p style="margin:0 0 12px;font-size:16px">Hi ${esc(o.name)},</p>
<p style="margin:0 0 16px;font-size:16px;line-height:1.5">${lead}</p>
<div style="background:#f2f8ff;border-left:4px solid #2e8fdc;border-radius:8px;padding:12px 14px;margin:0 0 20px;font-size:15px;line-height:1.5;white-space:pre-wrap">${esc(o.excerpt)}</div>
<a href="${o.postUrl}" style="display:inline-block;background:#f0712c;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px">Read and reply</a>
<p style="margin:22px 0 0;font-size:13px;color:#55657d;line-height:1.5">Meet new trekking partners in a public place first. <a href="${SITE}/safety/" style="color:#1a72bd">Safety tips</a></p>
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #d6e3f3;font-size:12px;color:#55657d;line-height:1.5">
You get this because you posted or replied on Trekking Partners Nepal.
<a href="${o.unsubUrl}" style="color:#55657d">Turn off reply emails</a>
</td></tr></table></td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok');

  // Only our own database may call this
  const secret = req.headers.get('x-alert-secret') ?? '';
  const { data: ok } = await db.rpc('check_alert_secret', { s: secret });
  if (!ok) return new Response('forbidden', { status: 403 });

  const { comment_id } = await req.json().catch(() => ({}));
  if (!comment_id) return new Response('missing comment_id', { status: 400 });

  const { data: c } = await db.from('comments').select('id, trip_id, user_id, body').eq('id', comment_id).maybeSingle();
  if (!c) return new Response('no comment');
  const { data: trip } = await db.from('trips').select('id, user_id, trek').eq('id', c.trip_id).maybeSingle();
  if (!trip) return new Response('no trip');

  // Everyone involved: the post owner and earlier repliers, except the person who just replied
  const { data: earlier } = await db.from('comments').select('user_id').eq('trip_id', trip.id);
  const ids = [...new Set([trip.user_id, ...(earlier ?? []).map((r) => r.user_id)])].filter((id) => id !== c.user_id);
  if (!ids.length) return new Response('nobody to tell');

  const [{ data: people }, { data: replier }, { data: adminRow }, { data: bans }, { data: recent }] = await Promise.all([
    db.from('profiles').select('id, display_name, email_replies, unsub_token').in('id', ids),
    db.from('profiles').select('display_name').eq('id', c.user_id).maybeSingle(),
    db.from('admins').select('user_id').eq('user_id', c.user_id).maybeSingle(),
    db.from('bans').select('user_id').in('user_id', ids),
    db.from('reply_emails').select('user_id').eq('trip_id', trip.id).in('user_id', ids)
      .gte('sent_at', new Date(Date.now() - QUIET_MINUTES * 60_000).toISOString()),
  ]);
  const skip = new Set([...(bans ?? []).map((b) => b.user_id), ...(recent ?? []).map((r) => r.user_id)]);

  // Replies from the team account show the site name, not the personal profile
  const replierName = adminRow ? 'Trekking Partners Nepal Admin' : (replier?.display_name || 'A trekker');

  const trek = trekName(trip.trek);
  const postUrl = `${SITE}/post/?id=${trip.id}`;
  let sent = 0;

  for (const p of people ?? []) {
    if (!p.email_replies || skip.has(p.id)) continue;
    const { data: u } = await db.auth.admin.getUserById(p.id);
    const to = u?.user?.email;
    if (!to) continue;
    const isOwner = p.id === trip.user_id;
    const unsubUrl = `${SITE}/unsubscribe/?t=${p.unsub_token}`;
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        reply_to: REPLY_TO,
        subject: isOwner
          ? `${replierName} replied to your ${trek} post`
          : `New reply on the ${trek} post`,
        html: emailHtml({
          name: (p.display_name || 'trekker').split(' ')[0],
          replier: replierName,
          trek, excerpt: short(c.body), postUrl, unsubUrl, isOwner,
        }),
        headers: { 'List-Unsubscribe': `<${unsubUrl}>, <mailto:${REPLY_TO}?subject=unsubscribe>` },
      }),
    });
    if (res.ok) {
      sent++;
      await db.from('reply_emails').insert({ user_id: p.id, trip_id: trip.id, comment_id: c.id });
    } else {
      console.error('Resend error', res.status, await res.text());
    }
  }
  return new Response(JSON.stringify({ sent }), { headers: { 'Content-Type': 'application/json' } });
});

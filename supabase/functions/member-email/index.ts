// Supabase Edge Function: member-email
// Sends the welcome email (new account) and the "your first post is live" email.
// Called by the database trigger in update-8-notifications.sql.
// Uses the same RESEND_API_KEY secret as reply-alert.
import { createClient } from 'npm:@supabase/supabase-js@2';

const SITE = 'https://trekkingpartnersnepal.com';
const FROM = 'Trekking Partners Nepal <hello@trekkingpartnersnepal.com>';
const REPLY_TO = 'hello@trekkingpartnersnepal.com';
const FB_GROUP = 'https://www.facebook.com/groups/887606059135821';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const trekName = (slug: string) => slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

const button = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#f0712c;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px">${label}</a>`;
const p = (html: string) => `<p style="margin:0 0 14px;font-size:16px;line-height:1.5">${html}</p>`;
const steps = (items: string[]) =>
  `<ol style="margin:0 0 20px;padding-left:20px;font-size:15px;line-height:1.6">${items.map((i) => `<li style="margin:0 0 6px">${i}</li>`).join('')}</ol>`;
const link = (href: string, label: string) => `<a href="${href}" style="color:#1a72bd">${label}</a>`;

function shell(body: string, footer: string) {
  return `<!doctype html><html><body style="margin:0;background:#f2f8ff;font-family:Arial,Helvetica,sans-serif;color:#0f1d33">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f8ff;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #d6e3f3;border-radius:14px">
<tr><td style="background:#081634;color:#ffffff;padding:18px 24px;border-radius:14px 14px 0 0;font-weight:bold;font-size:16px">Trekking Partners Nepal</td></tr>
<tr><td style="padding:24px">${body}</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #d6e3f3;font-size:12px;color:#55657d;line-height:1.5">${footer}</td></tr>
</table></td></tr></table></body></html>`;
}

function welcomeEmail(name: string) {
  return shell(
    p(`Hi ${esc(name)},`) +
    p(`Welcome to <strong>Trekking Partners Nepal</strong> – the place to find people to share the trail with in Nepal.`) +
    p(`Here’s how to get started:`) +
    steps([
      `<strong>Finish your profile</strong> – name, age and nationality. You need it to post a trek and to read replies.`,
      `<strong>Post your trek</strong> with your dates, or ${link(`${SITE}/find-partners/`, 'browse partner posts')} and say hi.`,
      `<strong>Read our ${link(`${SITE}/safety/`, 'safety tips')}</strong> before you meet anyone.`,
    ]) +
    `<div style="margin:0 0 22px">${button(`${SITE}/account/`, 'Complete my profile')}</div>` +
    p(`<span style="font-size:14px;color:#55657d">Prefer a small guided group? Join one of our ${link(`${SITE}/fixed-departures/`, 'fixed departures')}. You can also meet other trekkers in our ${link(FB_GROUP, 'Facebook group')}.</span>`),
    `You get this one-time email because you created an account on Trekking Partners Nepal. Questions? Just reply to this email.`,
  );
}

function firstPostEmail(name: string, trek: string, postUrl: string, emailReplies: boolean) {
  return shell(
    p(`Hi ${esc(name)},`) +
    p(`🎉 Your <strong>${esc(trek)}</strong> post is live! Other trekkers can now find it and reply.`) +
    p(`A few tips to find partners faster:`) +
    steps([
      `<strong>Share your post</strong> on WhatsApp, Facebook or in our ${link(FB_GROUP, 'Facebook group')} – shared posts get far more replies.`,
      emailReplies
        ? `<strong>We’ll let you know</strong> on the site and by email when someone replies.`
        : `<strong>Check the bell</strong> on the site for new replies (reply emails are off in your account).`,
      `<strong>Close your post</strong> in ${link(`${SITE}/account/`, 'My account')} once you’ve found partners.`,
      `<strong>Meet in a public place first</strong> – see our ${link(`${SITE}/safety/`, 'safety tips')}.`,
    ]) +
    `<div style="margin:0 0 22px">${button(postUrl, 'View my post')}</div>` +
    p(`<span style="font-size:14px;color:#55657d">No luck finding partners? Our ${link(`${SITE}/fixed-departures/`, 'fixed departures')} are small guided groups you can join on set dates.</span>`),
    `You get this one-time email because you published your first post on Trekking Partners Nepal.`,
  );
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok');

  // Only our own database may call this
  const secret = req.headers.get('x-alert-secret') ?? '';
  const { data: ok } = await db.rpc('check_alert_secret', { s: secret });
  if (!ok) return new Response('forbidden', { status: 403 });

  const { notification_id } = await req.json().catch(() => ({}));
  if (!notification_id) return new Response('missing notification_id', { status: 400 });

  const { data: n } = await db.from('notifications').select('id, user_id, kind, trip_id').eq('id', notification_id).maybeSingle();
  if (!n || !['welcome', 'first_post'].includes(n.kind)) return new Response('nothing to send');

  const [{ data: prof }, { data: u }, { data: ban }] = await Promise.all([
    db.from('profiles').select('display_name, email_replies').eq('id', n.user_id).maybeSingle(),
    db.auth.admin.getUserById(n.user_id),
    db.from('bans').select('user_id').eq('user_id', n.user_id).maybeSingle(),
  ]);
  const to = u?.user?.email;
  if (!to || ban) return new Response('no recipient');
  const name = (prof?.display_name || u?.user?.user_metadata?.full_name || 'trekker').split(' ')[0];

  let subject: string, html: string;
  if (n.kind === 'welcome') {
    subject = 'Welcome to Trekking Partners Nepal 🏔️';
    html = welcomeEmail(name);
  } else {
    const { data: trip } = n.trip_id
      ? await db.from('trips').select('id, trek').eq('id', n.trip_id).maybeSingle()
      : { data: null };
    if (!trip) return new Response('post gone');
    const trek = trekName(trip.trek);
    subject = `Your ${trek} post is live`;
    html = firstPostEmail(name, trek, `${SITE}/post/?id=${trip.id}`, prof?.email_replies ?? true);
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], reply_to: REPLY_TO, subject, html }),
  });
  if (!res.ok) {
    console.error('Resend error', res.status, await res.text());
    return new Response('send failed', { status: 502 });
  }
  return new Response(JSON.stringify({ sent: 1 }), { headers: { 'Content-Type': 'application/json' } });
});

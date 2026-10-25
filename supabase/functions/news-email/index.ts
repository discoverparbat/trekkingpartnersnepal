// Supabase Edge Function: news-email
// Sends one-off emails (festival greetings, site news) to every member who hasn't turned them off.
// Called by public.send_news_email(campaign) in update-17-news-emails.sql.
// Each member gets each campaign at most once (logged in public.news_emails), so it is safe to call again.
// Uses the same RESEND_API_KEY secret as reply-alert.
import { createClient } from 'npm:@supabase/supabase-js@2';

const SITE = 'https://trekkingpartnersnepal.com';
const FROM = 'Trekking Partners Nepal <hello@trekkingpartnersnepal.com>';
const REPLY_TO = 'hello@trekkingpartnersnepal.com';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const p = (html: string) => `<p style="margin:0 0 14px;font-size:16px;line-height:1.5">${html}</p>`;
const button = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#f0712c;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px">${label}</a>`;
const link = (href: string, label: string) => `<a href="${href}" style="color:#1a72bd">${label}</a>`;

function shell(body: string, unsubUrl: string) {
  return `<!doctype html><html><body style="margin:0;background:#f2f8ff;font-family:Arial,Helvetica,sans-serif;color:#0f1d33">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f8ff;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #d6e3f3;border-radius:14px">
<tr><td style="background:#081634;color:#ffffff;padding:18px 24px;border-radius:14px 14px 0 0;font-weight:bold;font-size:16px">Trekking Partners Nepal</td></tr>
<tr><td style="padding:24px">${body}</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #d6e3f3;font-size:12px;color:#55657d;line-height:1.5">
You get this email because you have an account on Trekking Partners Nepal. We only send news and greetings a few times a year.
<a href="${unsubUrl}" style="color:#55657d">Turn off news emails</a></td></tr>
</table></td></tr></table></body></html>`;
}

// ── Campaigns ──────────────────────────────────────────────────
type Campaign = { subject: string; html: (name: string) => string };

const ARTICLE = 'https://discoverparbat.com/article/vijaya-dashami-meaning-story';
const WEATHER_ARTICLE = 'https://discoverparbat.com/article/cyclone-arnab-nepal-trekking-weather';

const CAMPAIGNS: Record<string, Campaign> = {
  'dashain-2083': {
    subject: 'Happy Vijaya Dashami from Nepal 🌼',
    html: (name) =>
      p(`Hi ${esc(name)},`) +
      p(`<strong>विजया दशमीको हार्दिक शुभकामना!</strong> Happy Vijaya Dashami from all of us at Trekking Partners Nepal.`) +
      p(`Today is the biggest day of Dashain, Nepal’s most important festival. Families gather, elders place red tika and green jamara on the foreheads of younger relatives with their blessings, and the hills fill with kites and bamboo swings. We wish you and your loved ones good health, happiness and many good days on the trail.`) +
      `<a href="${ARTICLE}" style="display:block;text-decoration:none;color:#0f1d33;border:1px solid #d6e3f3;border-radius:12px;overflow:hidden;margin:0 0 18px">
<img src="https://discoverparbat.com/article/vijaya-dashami-tika.jpg" width="472" alt="Dashain tika plate with jamara and marigolds" style="display:block;width:100%;height:auto;border:0">
<div style="padding:14px 16px">
<div style="font-size:12px;color:#55657d;margin:0 0 4px">DISCOVER PARBAT</div>
<div style="font-size:17px;font-weight:bold;line-height:1.35;margin:0 0 6px">Vijaya Dashami Explained: The Story, Meaning and Spirit of Dashain</div>
<div style="font-size:14px;color:#55657d;line-height:1.45">The legends of Durga and Rama, what tika and jamara mean, and how to be a good guest if you’re in Nepal during Dashain.</div>
</div></a>` +
      `<div style="margin:0 0 22px">${button(ARTICLE, 'Read the article')}</div>` +
      p(`<span style="font-size:14px;color:#55657d">Trekking during the holidays? Buses fill up and many offices close for a few days, so plan travel early. Looking for company on the trail? ${link(`${SITE}/find-partners/`, 'Find a trekking partner')}.</span>`),
  },
  'cyclone-arnab-2083': {
    subject: 'Weather alert: Cyclone Arnab brings rain and heavy snow to Nepal, 28–31 Oct',
    html: (name) =>
      p(`Hi ${esc(name)},`) +
      p(`A quick heads-up if you’re trekking in Nepal this week. A storm in the Bay of Bengal, expected to become <strong>Cyclone Arnab</strong>, is forecast to bring heavy rain to the hills and deep snow to the high Himalaya.`) +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px"><tr><td style="padding:14px 16px;font-size:15px;line-height:1.6;color:#431407">
<strong>Mon–Tue (26–27 Oct):</strong> sunny<br>
<strong>Wed (28 Oct):</strong> clouds build from the afternoon<br>
<strong>Thu–Fri (29–30 Oct):</strong> heavy rain and snow, worst from Thursday night<br>
<strong>Sat (31 Oct):</strong> easing · <strong>Sun (1 Nov):</strong> clearing<br>
<span style="display:block;margin-top:8px">Expect 100–200 mm of rain in the hills and 0.25–1.5 m of snow in the high mountains, heaviest around Dhaulagiri, Annapurna and Manaslu.</span>
</td></tr></table>` +
      p(`<strong>Pause high treks and pass crossings from Wednesday to Saturday</strong> (Thorong La, Larkya La and similar). Already on the trail? Be at a safe, lower village by Wednesday evening and wait for the weather to clear.`) +
      `<a href="${WEATHER_ARTICLE}" style="display:block;text-decoration:none;color:#0f1d33;border:1px solid #d6e3f3;border-radius:12px;margin:0 0 18px">
<div style="padding:14px 16px">
<div style="font-size:12px;color:#55657d;margin:0 0 4px">DISCOVER PARBAT</div>
<div style="font-size:17px;font-weight:bold;line-height:1.35;margin:0 0 6px">Cyclone Arnab and Nepal: Trekking Weather Alert for 28 October to 1 November</div>
<div style="font-size:14px;color:#55657d;line-height:1.45">Day-by-day forecast, which treks to pause, roads and flights, and when the weather clears.</div>
</div></a>` +
      `<div style="margin:0 0 22px">${button(WEATHER_ARTICLE, 'Read the full update')}</div>` +
      p(`<span style="font-size:14px;color:#55657d">Planning a trek with partners this week? Talk to them about moving your start date, and update the dates on your post in ${link(`${SITE}/account/`, 'My account')}. Questions about conditions? Ask in the ${link(`${SITE}/community/`, 'Community')}.</span>`),
  },
};

// ── Helpers ────────────────────────────────────────────────────
async function allEmails(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const u of data.users) if (u.email) map.set(u.id, u.email);
    if (data.users.length < 1000) break;
  }
  return map;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok');

  // Only our own database may call this
  const secret = req.headers.get('x-alert-secret') ?? '';
  const { data: ok } = await db.rpc('check_alert_secret', { s: secret });
  if (!ok) return new Response('forbidden', { status: 403 });

  const { campaign } = await req.json().catch(() => ({}));
  const c = CAMPAIGNS[campaign];
  if (!c) return new Response('unknown campaign', { status: 400 });

  const [{ data: profs }, { data: bans }, { data: sent }, emails] = await Promise.all([
    db.from('profiles').select('id, display_name, unsub_token').eq('email_news', true),
    db.from('bans').select('user_id'),
    db.from('news_emails').select('user_id').eq('campaign', campaign),
    allEmails(),
  ]);
  const skip = new Set([...(bans ?? []).map((b) => b.user_id), ...(sent ?? []).map((s) => s.user_id)]);
  const todo = (profs ?? []).filter((pr) => !skip.has(pr.id) && emails.has(pr.id));

  let count = 0, failed = 0;
  for (let i = 0; i < todo.length; i += 100) {
    const chunk = todo.slice(i, i + 100);
    const batch = chunk.map((pr) => {
      const unsubUrl = `${SITE}/unsubscribe/?t=${pr.unsub_token}&list=news`;
      return {
        from: FROM,
        to: [emails.get(pr.id)!],
        reply_to: REPLY_TO,
        subject: c.subject,
        html: shell(c.html((pr.display_name || 'trekker').split(' ')[0]), unsubUrl),
        headers: { 'List-Unsubscribe': `<${unsubUrl}>, <mailto:${REPLY_TO}?subject=unsubscribe>` },
      };
    });
    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      console.error('Resend error', res.status, await res.text());
      failed += chunk.length;
      continue;
    }
    await db.from('news_emails').insert(chunk.map((pr) => ({ campaign, user_id: pr.id })));
    count += chunk.length;
    await new Promise((r) => setTimeout(r, 600));   // stay under Resend's rate limit
  }
  return new Response(JSON.stringify({ campaign, sent: count, failed }), { headers: { 'Content-Type': 'application/json' } });
});

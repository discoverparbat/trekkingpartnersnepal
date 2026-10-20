// Cloudflare Pages Function for /post/?id=…
// Post pages load their content in the browser, so WhatsApp, Facebook and Google would only
// see a generic title. This runs on Cloudflare before the page is sent and fills in the real
// trek, dates, description and photo for link previews. The page itself is unchanged.
import { getTrek } from '../../src/data/treks';
import { getRegion } from '../../src/data/regions';

// Same public (publishable) key the website already uses in src/lib/supabase.ts
const SUPABASE_URL = 'https://waorryrsgdfvhujreuvq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_xZ4nFS-OrOyHDu8kkzJVYg_0y4I4ogh';
const SITE = 'https://trekkingpartnersnepal.com';

const fmt = (d: string, o: Intl.DateTimeFormatOptions) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { ...o, timeZone: 'UTC' });
function dates(start: string, end: string | null, flexible: boolean) {
  let s = !end || end === start
    ? fmt(start, { day: 'numeric', month: 'short', year: 'numeric' })
    : `${fmt(start, { day: 'numeric', month: 'short' })} – ${fmt(end, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  return flexible ? s + ' (flexible)' : s;
}
const clip = (t: string, n: number) => {
  const one = t.replace(/\s+/g, ' ').trim();
  return one.length > n ? one.slice(0, n - 1).trimEnd() + '…' : one;
};

async function rest(env: any, path: string) {
  const base = env?.SUPABASE_URL || SUPABASE_URL;   // env override only used for local testing
  const res = await fetch(`${base}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Accept: 'application/json' },
    cf: { cacheTtl: 60 },
  } as RequestInit);
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) ? rows[0] ?? null : null;
}

// One member's public details via member_profiles() (update 13); the old view until that has run
async function profile(env: any, userId: string) {
  const base = env?.SUPABASE_URL || SUPABASE_URL;
  const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Accept: 'application/json', 'Content-Type': 'application/json' };
  const res = await fetch(`${base}/rest/v1/rpc/member_profiles`, { method: 'POST', headers, body: JSON.stringify({ ids: [userId] }) });
  if (res.ok) {
    const rows = await res.json();
    return Array.isArray(rows) ? rows[0] ?? null : null;
  }
  return rest(env, `public_profiles?id=eq.${userId}&select=display_name,nationality`);
}

class SetAttr {
  constructor(private value: string) {}
  element(el: any) { el.setAttribute('content', this.value); }
}
class SetText {
  constructor(private value: string) {}
  element(el: any) { el.setInnerContent(this.value); }
}
class Append {
  constructor(private html: string) {}
  element(el: any) { el.append(this.html, { html: true }); }
}

export async function onRequestGet(context: any) {
  const { request, env, next } = context;
  const page = await next();                       // the normal static /post/ page
  const id = new URL(request.url).searchParams.get('id') ?? '';
  if (!/^[0-9a-f-]{36}$/i.test(id) || !(page.headers.get('content-type') || '').includes('text/html')) return page;

  let trip: any = null;
  try {
    trip = await rest(env, `trips?id=eq.${id}&select=id,user_id,trek,region,start_date,end_date,flexible,group_size,description,status`);
  } catch {}
  if (!trip) return page;

  let author: any = null;
  try { author = await profile(env, trip.user_id); } catch {}

  const trek = getTrek(trip.trek);
  const region = getRegion(trip.region);
  const trekName = trek?.name ?? trip.trek;
  const when = dates(trip.start_date, trip.end_date, trip.flexible);
  const looking = trip.group_size && trip.group_size > 1 ? ` · group of ${trip.group_size}` : '';
  const title = `${trekName} · ${when} – trekking partner wanted`;
  const who = author?.display_name ? `${author.display_name.split(' ')[0]}${author.nationality ? ` (${author.nationality})` : ''}: ` : '';
  const description = trip.status === 'closed'
    ? `This post is closed. Find other trekkers heading to ${trekName} on Trekking Partners Nepal.`
    : clip(`${who}${trip.description}`, 190) + looking;
  const image = new URL(trek?.image || region?.card || '/images/hero.jpg', SITE).href;
  const url = `${SITE}/post/?id=${trip.id}`;

  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
  const extra = `<meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${esc(image)}"><meta property="og:image:alt" content="${esc(trekName)}">`;

  const out = new HTMLRewriter()
    .on('title', new SetText(`${title} | Trekking Partners Nepal`))
    .on('meta[name="description"]', new SetAttr(description))
    .on('meta[property="og:title"]', new SetAttr(title))
    .on('meta[property="og:description"]', new SetAttr(description))
    .on('meta[property="og:image"]', new SetAttr(image))
    .on('meta[property="og:url"]', new SetAttr(url))
    .on('meta[property="og:type"]', new SetAttr('article'))
    .on('link[rel="canonical"]', { element(el: any) { el.setAttribute('href', url); } })
    .on('head', new Append(extra))
    .transform(page);

  const headers = new Headers(out.headers);
  headers.set('Cache-Control', 'public, max-age=60');
  return new Response(out.body, { status: out.status, headers });
}

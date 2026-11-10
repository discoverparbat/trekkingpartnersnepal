// Cloudflare Pages Function for /departure/?id=…
//
// Each fixed departure is a dated event, but the permanent page for a trek is /<region>/<trek>/.
// - Finished, unpublished or deleted departures → 301 to that trek's page (#departures), so links
//   shared on Facebook, WhatsApp or in emails keep working and pass their value to the trek page
//   instead of ending on "Departure not found".
// - Upcoming departures → the normal page, with the real trek, dates and photo filled in for link
//   previews (the page itself loads its content in the browser).
import { getTrek, trekTitle } from '../../src/data/treks';
import { getRegion } from '../../src/data/regions';

// Same public (publishable) key the website already uses in src/lib/supabase.ts
const SUPABASE_URL = 'https://waorryrsgdfvhujreuvq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_xZ4nFS-OrOyHDu8kkzJVYg_0y4I4ogh';
const SITE = 'https://trekkingpartnersnepal.com';

// Nepal date (UTC+5:45), so a trek that ends today still counts as running today
const nepalToday = () => new Date(Date.now() + 345 * 60_000).toISOString().slice(0, 10);

function lastDay(start: string, days: number) {
  const d = new Date(start + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + Math.max(1, days) - 1);
  return d.toISOString().slice(0, 10);
}

const fmt = (d: string, o: Intl.DateTimeFormatOptions) =>
  new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { ...o, timeZone: 'UTC' });

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

function redirect(path: string, status: 301 | 302) {
  return new Response(null, {
    status,
    headers: { Location: new URL(path, SITE).href, 'Cache-Control': 'public, max-age=300' },
  });
}

export async function onRequestGet(context: any) {
  const { request, env, next } = context;
  const params = new URL(request.url).searchParams;
  const id = params.get('id') ?? '';
  // ?preview lets an admin open an unpublished or past departure without being redirected
  if (!/^[0-9a-f-]{36}$/i.test(id) || params.has('preview')) return next();

  let dep: any = null;
  let lookupFailed = false;
  try {
    const base = env?.SUPABASE_URL || SUPABASE_URL;   // env override only used for local testing
    const res = await fetch(
      `${base}/rest/v1/departures?id=eq.${id}&select=id,trek,start_date,days,price,seats_left,group_max,published`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Accept: 'application/json' }, cf: { cacheTtl: 60 } } as RequestInit,
    );
    if (res.ok) {
      const rows = await res.json();
      dep = Array.isArray(rows) ? rows[0] ?? null : null;
    } else lookupFailed = true;
  } catch { lookupFailed = true; }

  // Supabase unreachable: serve the normal page, which tries again in the browser
  if (lookupFailed) return next();

  const trek = dep ? getTrek(dep.trek) : undefined;
  const region = trek ? getRegion(trek.region) : undefined;

  // Gone or unknown → upcoming departures list (302: an admin may just have unpublished it)
  if (!dep || !trek || !region) return redirect('/fixed-departures/', 302);

  const trekPage = `/${region.slug}/${trek.slug}/#departures`;
  if (!dep.published) return redirect(trekPage, 302);

  // Finished → the trek's permanent page, for good
  if (lastDay(dep.start_date, dep.days) < nepalToday()) return redirect(trekPage, 301);

  // Upcoming: fill in link-preview details
  const page = await next();
  if (!(page.headers.get('content-type') || '').includes('text/html')) return page;

  const end = lastDay(dep.start_date, dep.days);
  const range = `${fmt(dep.start_date, { day: 'numeric', month: 'short' })} – ${fmt(end, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  const title = `${trekTitle(trek)} · ${range} fixed departure`;
  const seats = dep.seats_left <= 0 ? 'Fully booked – ask about the next date.' : `${dep.seats_left} of ${dep.group_max} seats left.`;
  const description = `Join a small-group ${trek.name} trek with a licensed local guide, ${range} (${dep.days} days)${dep.price ? `, from ${dep.price}` : ''}. ${seats}`;
  const image = new URL(trek.image || region.hero, SITE).href;
  const url = `${SITE}/departure/?id=${dep.id}`;

  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
  const extra = `<meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta property="og:image:alt" content="${esc(trek.name)}">`;

  const out = new HTMLRewriter()
    .on('title', new SetText(`${title} | Trekking Partners Nepal`))
    .on('meta[name="description"]', new SetAttr(description))
    .on('meta[property="og:title"]', new SetAttr(title))
    .on('meta[property="og:description"]', new SetAttr(description))
    .on('meta[property="og:image"]', new SetAttr(image))
    .on('meta[name="twitter:image"]', new SetAttr(image))
    .on('meta[property="og:url"]', new SetAttr(url))
    .on('head', new Append(extra))
    .transform(page);

  const headers = new Headers(out.headers);
  headers.set('Cache-Control', 'public, max-age=60');
  return new Response(out.body, { status: out.status, headers });
}

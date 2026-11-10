// Cloudflare Pages Function: /find-partners/sitemap.xml
// Lists the partner posts Google may index (open, dates not passed, at least one reply – see
// src/lib/postIndex.ts). Posts live in Supabase, not in the built site, so they can't go in the
// normal sitemap Astro makes at build time. Linked from robots.txt.
import { isIndexable, nepalToday } from '../../src/lib/postIndex';

const SUPABASE_URL = 'https://waorryrsgdfvhujreuvq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_xZ4nFS-OrOyHDu8kkzJVYg_0y4I4ogh';
const SITE = 'https://trekkingpartnersnepal.com';

async function get(base: string, path: string): Promise<any[]> {
  const res = await fetch(`${base}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Accept: 'application/json' },
    cf: { cacheTtl: 600 },
  } as RequestInit);
  if (!res.ok) return [];
  const rows = await res.json();
  return Array.isArray(rows) ? rows : [];
}

export async function onRequestGet(context: any) {
  const base = context.env?.SUPABASE_URL || SUPABASE_URL;
  const today = nepalToday();
  let urls: string[] = [];
  try {
    // Open posts whose trek hasn't finished yet (start date in the past is fine if end date isn't)
    const trips = await get(base,
      `trips?status=eq.open&or=(end_date.gte.${today},and(end_date.is.null,start_date.gte.${today}))` +
      `&select=id,status,start_date,end_date,description,created_at&order=start_date.asc&limit=2000`);
    if (trips.length) {
      const ids = trips.map((t) => t.id);
      const counts = new Map<string, number>();
      // Reply counts in chunks, to keep the URL short
      for (let i = 0; i < ids.length; i += 150) {
        const rows = await get(base, `trip_comment_counts?trip_id=in.(${ids.slice(i, i + 150).join(',')})&select=trip_id,replies`);
        rows.forEach((r) => counts.set(r.trip_id, r.replies));
      }
      urls = trips
        .filter((t) => isIndexable(t, counts.get(t.id) ?? 0, today))
        .map((t) => `<url><loc>${SITE}/post/?id=${t.id}</loc><lastmod>${String(t.created_at).slice(0, 10)}</lastmod></url>`);
    }
  } catch {}

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=600' },
  });
}

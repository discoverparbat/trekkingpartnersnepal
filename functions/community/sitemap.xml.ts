// Cloudflare Pages Function: /community/sitemap.xml
// Lists every Community question so Google finds them. Questions live in Supabase, not in the
// built site, so they can't go in the normal sitemap that Astro makes at build time.
const SUPABASE_URL = 'https://waorryrsgdfvhujreuvq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_xZ4nFS-OrOyHDu8kkzJVYg_0y4I4ogh';
const SITE = 'https://trekkingpartnersnepal.com';

export async function onRequestGet(context: any) {
  const base = context.env?.SUPABASE_URL || SUPABASE_URL;
  let rows: { id: string; last_activity_at: string }[] = [];
  try {
    const res = await fetch(
      `${base}/rest/v1/questions?status=neq.moved&select=id,last_activity_at&order=last_activity_at.desc&limit=5000`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Accept: 'application/json' }, cf: { cacheTtl: 600 } } as RequestInit,
    );
    if (res.ok) rows = await res.json();
  } catch {}

  const urls = [`<url><loc>${SITE}/community/</loc>${rows[0] ? `<lastmod>${rows[0].last_activity_at.slice(0, 10)}</lastmod>` : ''}</url>`]
    .concat(rows.map((q) => `<url><loc>${SITE}/community/question/?id=${q.id}</loc><lastmod>${q.last_activity_at.slice(0, 10)}</lastmod></url>`));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=600' },
  });
}

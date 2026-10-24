// Cloudflare Pages Function for /community/question/?id=…
// Question pages load their content in the browser. This runs on Cloudflare before the page is
// sent and writes in the real title, description, the question and its answers (plus QAPage
// structured data), so Google can index the conversation and link previews look right.
// The browser version replaces the written copy as soon as the page loads.
import { getTrek } from '../../../src/data/treks';

// Same public (publishable) key the website already uses in src/lib/supabase.ts
const SUPABASE_URL = 'https://waorryrsgdfvhujreuvq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_xZ4nFS-OrOyHDu8kkzJVYg_0y4I4ogh';
const SITE = 'https://trekkingpartnersnepal.com';
const TEAM = 'Trekking Partners Nepal';

const clip = (t: string, n: number) => {
  const one = t.replace(/\s+/g, ' ').trim();
  return one.length > n ? one.slice(0, n - 1).trimEnd() + '…' : one;
};
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

async function rest(env: any, path: string, init: RequestInit = {}): Promise<any> {
  const base = env?.SUPABASE_URL || SUPABASE_URL;   // env override only used for local testing
  const res = await fetch(`${base}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Accept: 'application/json', 'Content-Type': 'application/json' },
    cf: { cacheTtl: 60 },
  } as RequestInit);
  if (!res.ok) return null;
  return res.json();
}

class SetAttr {
  constructor(private value: string) {}
  element(el: any) { el.setAttribute('content', this.value); }
}
class SetText {
  constructor(private value: string) {}
  element(el: any) { el.setInnerContent(this.value); }
}
class SetHtml {
  constructor(private html: string) {}
  element(el: any) { el.setInnerContent(this.html, { html: true }); }
}
class Append {
  constructor(private html: string) {}
  element(el: any) { el.append(this.html, { html: true }); }
}

export async function onRequestGet(context: any) {
  const { request, env, next } = context;
  const page = await next();                       // the normal static /community/question/ page
  const id = new URL(request.url).searchParams.get('id') ?? '';
  if (!/^[0-9a-f-]{36}$/i.test(id) || !(page.headers.get('content-type') || '').includes('text/html')) return page;

  let q: any = null;
  let answers: any[] = [];
  let people = new Map<string, any>();
  let team = new Set<string>();
  let helpful = new Map<string, number>();
  try {
    const rows = await rest(env, `questions?id=eq.${id}&select=id,user_id,trek,title,body,status,best_answer_id,answers_count,created_at,last_activity_at`);
    q = Array.isArray(rows) ? rows[0] ?? null : null;
    if (!q || q.status === 'moved') return page;
    const [ans, admins] = await Promise.all([
      rest(env, `answers?question_id=eq.${id}&select=id,user_id,body,created_at&order=created_at.asc&limit=100`),
      rest(env, 'rpc/admin_ids', { method: 'POST', body: '{}' }),
    ]);
    answers = Array.isArray(ans) ? ans : [];
    // "Helpful" votes (public view) become upvoteCount in the QAPage schema
    if (answers.length) {
      const votes = await rest(env, `answer_vote_counts?answer_id=in.(${answers.map((a) => a.id).join(',')})&select=answer_id,helpful`);
      helpful = new Map((Array.isArray(votes) ? votes : []).map((v: any) => [v.answer_id, Number(v.helpful) || 0]));
    }
    team = new Set((Array.isArray(admins) ? admins : []).map((r: any) => (typeof r === 'string' ? r : r.admin_ids ?? r.user_id)));
    const ids = [...new Set([q.user_id, ...answers.map((a) => a.user_id)])];
    // member_profiles() (update 13) takes up to 50 ids; the old view until that update has run
    let profs = await rest(env, 'rpc/member_profiles', { method: 'POST', body: JSON.stringify({ ids: ids.slice(0, 50) }) });
    if (!Array.isArray(profs)) profs = await rest(env, `public_profiles?id=in.(${ids.join(',')})&select=id,display_name,nationality`);
    people = new Map((Array.isArray(profs) ? profs : []).map((p: any) => [p.id, p]));
  } catch {}
  if (!q) return page;

  const nameOf = (uid: string) => (team.has(uid) ? TEAM : people.get(uid)?.display_name?.split(' ')[0] || 'Trekker');
  const trek = getTrek(q.trek);
  const trekName = trek?.name ?? (q.trek === 'general' ? 'Nepal trekking' : q.trek);
  const url = `${SITE}/community/question/?id=${q.id}`;
  const title = `${clip(q.title, 90)} – ${trekName}`;
  const n = answers.length;
  const description = clip(`${q.body} · ${n === 0 ? 'No answers yet' : n === 1 ? '1 answer' : `${n} answers`} from trekkers and our local team.`, 200);
  const image = new URL(trek?.image || '/images/hero.jpg', SITE).href;

  // Best answer first, like the page itself
  const best = answers.find((a) => a.id === q.best_answer_id);
  const ordered = best ? [best, ...answers.filter((a) => a !== best)] : answers;

  const html =
    `<article class="ssr-q"><p><a href="/community/">Community</a> · ${esc(trekName)}</p>` +
    `<h1>${esc(q.title)}</h1><p>Asked by ${esc(nameOf(q.user_id))} · ${day(q.created_at)}</p><p>${esc(q.body)}</p></article>` +
    `<h2>${n === 0 ? 'No answers yet' : n === 1 ? '1 answer' : `${n} answers`}</h2>` +
    ordered.map((a) =>
      `<div class="ssr-a"><strong>${esc(nameOf(a.user_id))}</strong>${a === best ? ' · ✓ Best answer' : ''} · ${day(a.created_at)}\n${esc(a.body)}</div>`
    ).join('');

  const answerLd = (a: any) => ({
    '@type': 'Answer',
    text: clip(a.body, 2000),
    dateCreated: a.created_at,
    datePublished: a.created_at,
    upvoteCount: helpful.get(a.id) ?? 0,
    url: `${url}#a-${a.id}`,
    author: team.has(a.user_id)
      ? { '@type': 'Organization', name: TEAM, url: SITE }
      : { '@type': 'Person', name: nameOf(a.user_id) },
  });
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: q.title,
      text: clip(q.body, 2000),
      answerCount: n,
      dateCreated: q.created_at,
      datePublished: q.created_at,
      author: team.has(q.user_id) ? { '@type': 'Organization', name: TEAM, url: SITE } : { '@type': 'Person', name: nameOf(q.user_id) },
      ...(best ? { acceptedAnswer: answerLd(best) } : {}),
      ...(n ? { suggestedAnswer: answers.filter((a) => a !== best).slice(0, 20).map(answerLd) } : {}),
    },
  };
  const jsonLd = JSON.stringify(schema).replace(/</g, '\\u003c');

  const extra =
    `<meta name="robots" content="max-image-preview:large">` +
    `<meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}">` +
    `<meta property="og:image:alt" content="${esc(trekName)}">` +
    `<script type="application/ld+json">${jsonLd}</script>`;

  const out = new HTMLRewriter()
    .on('title', new SetText(`${title} | Trekking Partners Nepal`))
    .on('meta[name="robots"]', { element(el: any) { el.remove(); } })      // the empty template is noindex; real questions are not
    .on('meta[name="description"]', new SetAttr(description))
    .on('meta[property="og:title"]', new SetAttr(title))
    .on('meta[property="og:description"]', new SetAttr(description))
    .on('meta[property="og:image"]', new SetAttr(image))
    .on('meta[name="twitter:image"]', new SetAttr(image))
    .on('meta[property="og:url"]', new SetAttr(url))
    .on('meta[property="og:type"]', new SetAttr('article'))
    .on('link[rel="canonical"]', { element(el: any) { el.setAttribute('href', url); } })
    .on('head', new Append(extra))
    .on('#ssr', new SetHtml(html))
    .on('#crumb', new SetText(trekName))
    .transform(page);

  const headers = new Headers(out.headers);
  headers.set('Cache-Control', 'public, max-age=60');
  return new Response(out.body, { status: out.status, headers });
}

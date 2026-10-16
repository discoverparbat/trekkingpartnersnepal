import { getCollection, type CollectionEntry } from 'astro:content';
import { getRegion } from '../data/regions';
import { getTrek } from '../data/treks';

export type Article = CollectionEntry<'news'>;

// Published articles (from Supabase at build time), newest first.
export async function getArticles(): Promise<Article[]> {
  const all = await getCollection('news');
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export const articleUrl = (a: Article) => `/news/${a.id}/`;

// Article photo, or a photo of the first tagged trek/region, or the site hero.
export function articleImage(a: Article): string {
  if (a.data.image) return a.data.image;
  const trek = a.data.treks.map(getTrek).find(Boolean);
  if (trek?.image) return trek.image;
  const region = getRegion(trek?.region ?? a.data.regions[0] ?? '');
  return region?.hero ?? '/images/hero.jpg';
}

// Articles tagged with a trek, or with that trek's region.
export async function articlesForTrek(trekSlug: string, limit = 3) {
  const trek = getTrek(trekSlug);
  return (await getArticles())
    .filter((a) => a.data.treks.includes(trekSlug) || (trek && a.data.regions.includes(trek.region)))
    .slice(0, limit);
}

// Articles tagged with a region, or with any trek in it.
export async function articlesForRegion(regionSlug: string, limit = 3) {
  return (await getArticles())
    .filter((a) => a.data.regions.includes(regionSlug) || a.data.treks.some((t) => getTrek(t)?.region === regionSlug))
    .slice(0, limit);
}

const fmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kathmandu' });
export const formatDate = (d: Date) => fmt.format(d);
export const isoDate = (d: Date) => d.toISOString();

export function readingTime(body = '') {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

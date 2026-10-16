// News & updates articles live in Supabase (table: news) and are written at /admin/ (News tab).
// They are fetched once when the site is built, so every article is a real, pre-built page for Google.
// Saving an article in /admin/ triggers a Cloudflare rebuild (Supabase webhook → deploy hook).
import { readFileSync } from 'node:fs';
import { defineCollection } from 'astro:content';
import type { Loader } from 'astro/loaders';
import { z } from 'astro/zod';
import { supabase } from './lib/supabase';
import { categorySlugs } from './data/news';

const COLUMNS =
  'slug, title, description, body, category, trail_status, regions, treks, image, image_alt, author, sources, featured, published_on, updated_on';

async function fetchRows(): Promise<any[]> {
  // For offline testing only: NEWS_FIXTURE=path/to/rows.json npm run build
  if (process.env.NEWS_FIXTURE) return JSON.parse(readFileSync(process.env.NEWS_FIXTURE, 'utf8'));
  const { data, error } = await supabase
    .from('news')
    .select(COLUMNS)
    .eq('published', true)
    .order('published_on', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

const supabaseNews: Loader = {
  name: 'supabase-news',
  async load({ store, logger, renderMarkdown, generateDigest, parseData }) {
    let rows: any[];
    try {
      rows = await fetchRows();
    } catch (e: any) {
      // On Cloudflare, stop the build so the live site keeps its current articles
      // instead of being rebuilt with none. Locally (npm run dev) carry on without news.
      if (import.meta.env.DEV) {
        logger.warn(`Could not load news from Supabase (${e.message ?? e}). Continuing without articles.`);
        return;
      }
      throw new Error(`Could not load news from Supabase: ${e.message ?? e}`);
    }
    store.clear();
    for (const r of rows) {
      const body = r.body ?? '';
      const data = await parseData({
        id: r.slug,
        data: {
          title: r.title,
          description: r.description,
          date: r.published_on,
          updated: r.updated_on ?? undefined,
          category: r.category,
          trailStatus: r.trail_status ?? undefined,
          regions: r.regions ?? [],
          treks: r.treks ?? [],
          image: r.image || undefined,
          imageAlt: r.image_alt || undefined,
          author: r.author || undefined,
          sources: Array.isArray(r.sources) ? r.sources : [],
          featured: !!r.featured,
        },
      });
      store.set({
        id: r.slug,
        data,
        body,
        rendered: await renderMarkdown(body),
        digest: generateDigest(r),
      });
    }
    logger.info(`Loaded ${rows.length} published news article(s)`);
  },
};

const news = defineCollection({
  loader: supabaseNews,
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    category: z.enum(categorySlugs),
    regions: z.array(z.string()).default([]),
    treks: z.array(z.string()).default([]),
    trailStatus: z.enum(['open', 'caution', 'closed']).optional(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    author: z.string().default('Sameer Regmi'),
    sources: z.array(z.object({ title: z.string(), url: z.string() })).default([]),
    featured: z.boolean().default(false),
  }),
});

export const collections = { news };

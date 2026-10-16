// News & updates articles live in src/content/news/ as Markdown files.
// One file = one article at /news/<file-name>/. See NEWS-GUIDE.md.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { regions } from './data/regions';
import { treks } from './data/treks';
import { categorySlugs } from './data/news';

const regionSlugs = regions.map((r) => r.slug) as [string, ...string[]];
const trekSlugs = treks.map((t) => t.slug) as [string, ...string[]];

const news = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string().max(110),
    // Shown on cards and used as the Google description: aim for 120–158 characters.
    description: z.string().max(170),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    category: z.enum(categorySlugs),
    // Tag regions/treks so the article also shows on those pages.
    regions: z.array(z.enum(regionSlugs)).default([]),
    treks: z.array(z.enum(trekSlugs)).default([]),
    // Only for route/trail updates: shows a coloured status box.
    trailStatus: z.enum(['open', 'caution', 'closed']).optional(),
    image: z.string().optional(),      // e.g. /images/news/thorong-la.jpg (falls back to a region photo)
    imageAlt: z.string().optional(),
    author: z.string().default('Trekking Partners Nepal team'),
    sources: z.array(z.object({ title: z.string(), url: z.string().url() })).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { news };

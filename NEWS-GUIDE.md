# News & updates: how to publish

Articles are Markdown files in `src/content/news/`. Each file becomes a page at
`/news/<file-name>/`, so `manaslu-circuit-reopens.md` → `/news/manaslu-circuit-reopens/`.

## Publish a new article
1. Copy `src/content/news/_template.md` and rename it, e.g. `thorong-la-snow-update.md`
   (lowercase, hyphens, no spaces; this is the URL, so don't rename it after publishing).
2. Fill in the fields at the top and write the article below.
3. Optional photo: put it in `public/images/news/` and set `image: /images/news/name.jpg`.
   No photo? The trek's region photo is used automatically.
4. Check it locally: `npm run dev` → http://localhost:4321/news/ (drafts show here only).
5. Set `draft: false`, commit and push. Cloudflare rebuilds and it's live in a minute or two.

If something is wrong in a field (unknown trek slug, description too long…), `npm run build`
stops with an error that names the file and the field.

## Where articles appear
- `/news/`: all articles; the newest (or one with `featured: true`) is the big card
- `/news/topic/<category>/`: route-updates, trek-news, permits-rules, tourism-news
- Homepage "Trail news" section: latest 3 (hidden until the first article is published)
- Trek and region pages: "Latest updates for …" box, from the `treks` and `regions` tags
- `/news/rss.xml`: RSS feed
- `sitemap-index.xml`: added automatically

## Updating an article
Change the text, add `updated: YYYY-MM-DD`, and change `trailStatus` if needed.
Google and the page then show "Updated …". Updating the same page beats writing a new one
for an ongoing story (e.g. a road closure), since the page keeps its ranking.

## Categories and fields
Categories are in `src/data/news.ts`. Field rules are in `src/content.config.ts`.

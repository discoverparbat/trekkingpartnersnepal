# Trekking Partners Nepal (Astro)

## Setup
```
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs to dist/
```

## public/ folder
```
public/
├── images/        hero.jpg + 12 region photos (easternnepal.webp and manaslu1.webp are .webp)
├── _headers
├── robots.txt
├── logo.png       (also used as the favicon)
└── login-test.html (delete before launch)
```
Pages like the homepage, privacy, terms, 404, login and the sitemap are built by Astro –
don't put .html or sitemap files for them in public/.

If you change an image's file type, update its path in `src/data/regions.ts`.

## Where to edit
- `src/data/regions.ts` – the 6 regions (text + images)
- `src/data/treks.ts` – all treks; adding one creates its page automatically
- `src/data/departures.ts` – fixed departures (SAMPLE dates – replace with real ones)
- `src/lib/supabase.ts` – Supabase URL and publishable key
- `src/pages/privacy.astro`, `src/pages/terms.astro` – legal pages

## Cloudflare Pages settings
- Framework preset: Astro
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variable: `NODE_VERSION` = `22`

## Supabase
Run `supabase/schema.sql` once in Supabase → SQL Editor. It creates the profiles, trips and comments tables with security rules.

Authentication → URL Configuration → Redirect URLs must include:
- https://trekkingpartnersnepal.com/login/
- http://localhost:4321/login/

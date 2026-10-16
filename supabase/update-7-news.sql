-- News & updates: articles managed at /admin/ (News tab)
-- Run once in Supabase: SQL Editor → New query → paste → Run.
-- Needs departures.sql to have been run before (it creates public.is_admin()).

-- ── Articles ─────────────────────────────────────────────────
create table if not exists public.news (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title         text not null check (char_length(title) between 5 and 140),
  description   text not null check (char_length(description) between 20 and 200),
  body          text not null default '',          -- Markdown
  category      text not null check (category in ('route-updates','trek-news','permits-rules','tourism-news')),
  trail_status  text check (trail_status in ('open','caution','closed')),
  regions       text[] not null default '{}',
  treks         text[] not null default '{}',
  image         text,                              -- full URL or /images/... path
  image_alt     text,
  author        text not null default 'Sameer Regmi',
  sources       jsonb not null default '[]',       -- [{"title": "...", "url": "https://..."}]
  featured      boolean not null default false,
  published     boolean not null default false,
  published_on  date not null default current_date,
  updated_on    date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists news_published_idx on public.news (published, published_on desc);

alter table public.news enable row level security;

drop policy if exists "Published news is public" on public.news;
create policy "Published news is public"
  on public.news for select using (published or public.is_admin());
drop policy if exists "Admins add news" on public.news;
create policy "Admins add news"
  on public.news for insert to authenticated with check (public.is_admin());
drop policy if exists "Admins edit news" on public.news;
create policy "Admins edit news"
  on public.news for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins delete news" on public.news;
create policy "Admins delete news"
  on public.news for delete to authenticated using (public.is_admin());

drop trigger if exists news_touch on public.news;
create trigger news_touch before update on public.news
  for each row execute function public.touch_updated_at();

-- ── Article photos (Storage bucket "news") ───────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('news', 'news', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "News photos are public" on storage.objects;
create policy "News photos are public"
  on storage.objects for select using (bucket_id = 'news');
drop policy if exists "Admins upload news photos" on storage.objects;
create policy "Admins upload news photos"
  on storage.objects for insert to authenticated with check (bucket_id = 'news' and public.is_admin());
drop policy if exists "Admins edit news photos" on storage.objects;
create policy "Admins edit news photos"
  on storage.objects for update to authenticated using (bucket_id = 'news' and public.is_admin());
drop policy if exists "Admins delete news photos" on storage.objects;
create policy "Admins delete news photos"
  on storage.objects for delete to authenticated using (bucket_id = 'news' and public.is_admin());

-- ── Two starter articles, saved as drafts (only added once) ──

insert into public.news (slug, title, description, body, category, trail_status, regions, treks, image_alt, sources, published)
values (
  'manaslu-circuit-reopens-after-namrung-flood',
  $t$Manaslu Circuit Reopens After the Namrung Flash Flood: What Trekkers Need to Know$t$,
  $t$A flash flood near Namrung washed away two bridges on the Manaslu Circuit in September 2026. The trail is open again on a temporary crossing. Here’s what changed.$t$,
  $body$The [Manaslu Circuit](/manaslu-region/manaslu-circuit/) is open again, but one section now crosses a **temporary wooden bridge** after a flash flood destroyed the main crossing near Namrung in early September. If you’re planning the circuit this autumn, here is what happened and what it means for your trek.

## What happened

In the early hours of **Sunday 6 September 2026**, heavy overnight rain swelled the **Therang Khola** above Namrung (Chumnubri Rural Municipality, northern Gorkha). The flood swept away **two suspension bridges** on the main trail between Deng and Samagaon, damaged four houses and took out two micro-hydropower plants. No deaths were reported.

The Gorkha District Administration Office suspended trekking on the Manaslu Circuit and the Larkya La until further notice, and the Manaslu Conservation Area Project issued a matching notice.

## How it reopened

Villagers, the conservation area office and the local police built an **alternative trail and a temporary wooden bridge** at Therang Khola within a few days. The route reopened around **8–9 September**, and groups have been crossing since then. Trekking companies on the route report that the detour is short and doesn’t add a day to a normal itinerary.

The provincial government has agreed to build a **permanent bridge**, but no start date has been announced.

## What this means for your trek

- **Expect a slower section near Namrung.** Cross the temporary bridge one person at a time and keep your poles packed away or strapped on.
- **Build in a spare day.** Late-monsoon landslides can still close parts of the Budhi Gandaki valley for a day or two.
- **Check Tsum Valley separately.** Reports from September mentioned landslides on Tsum Valley sections. The main circuit reopening does not confirm [Tsum Valley](/manaslu-region/tsum-valley/) access, so ask your guide before you go.
- **Permits haven’t changed.** Manaslu is still a restricted area: you need a licensed guide and at least two trekkers to get the permit.

> Need a second trekker for your Manaslu permit? Post your dates on the [Manaslu Circuit page](/manaslu-region/manaslu-circuit/) and other trekkers heading the same way can find you.

We’ll update this page when work on the permanent bridge starts, or if the trail status changes.
$body$,
  'route-updates', 'caution', array['manaslu-region']::text[], array['manaslu-circuit','tsum-valley']::text[],
  $t$Manaslu region trail in Gorkha, Nepal$t$,
  $j$[{"title": "Manaslu Treks – Manaslu Circuit open again after Namrung flood (updated 26 Sep 2026)", "url": "https://manaslutreks.com/manaslu-circuit-trek-reopens-namrung-flood-bridge/"}, {"title": "North Nepal Trek – Manaslu Circuit closed after flash flood (7 Sep 2026)", "url": "https://northnepaltrek.com/manaslu-circuit-trek-flash-flood-september"}, {"title": "Annapurna Trekking – Nepal floods 2026 trekking update (updated 12 Oct 2026)", "url": "https://annapurnatrekking.com/blog/nepal-floods-2026-trekking-update"}]$j$::jsonb,
  false
) on conflict (slug) do nothing;

insert into public.news (slug, title, description, body, category, trail_status, regions, treks, image_alt, sources, published)
values (
  'langtang-road-update-after-bhote-koshi-flood',
  $t$Langtang Treks After the Bhote Koshi Flood: Road Access Update$t$,
  $t$The August 2026 Bhote Koshi flood damaged the road to Syabrubesi. Langtang Valley treks are still running, but the start point and transport have changed.$t$,
  $body$On **26 August 2026** a large debris flood came down the Lhende Khola into the **Bhote Koshi and Trishuli rivers** in Rasuwa district, badly damaging the road corridor between Kathmandu and Syabrubesi, the usual starting point for Langtang treks.

## Is the Langtang trail open?

According to operators working in the area, **the trekking trail above Syabrubesi survived**, but the road to Syabrubesi did not. As of early October:

- Vehicles **could not reach Syabrubesi**.
- A temporary track opened on the **Galchhi–Betrawati** section on 2 October, with a Bailey bridge expected to follow.
- [Langtang Valley](/langtang-region/langtang-valley/) treks are starting and ending at **Thulo Syabru**, reached by 4WD jeep.
- No official reopening date has been announced for the Syabrubesi road.

## What it means for your plans

- **Budget for a 4WD jeep** to Thulo Syabru instead of the local bus to Syabrubesi, and expect a longer, rougher drive.
- **Routes that start from Syabrubesi need replanning.** If you’re doing the [Tamang Heritage Trail](/langtang-region/tamang-heritage-trail/), ask your guide how they’re handling access this season.
- **[Gosaikunda](/langtang-region/gosaikunda/) and Helambu** can be reached from the Dhunche or Sundarijal sides, so ask about alternative start points.
- **Reconfirm two to three weeks before you go.** Road repairs are moving quickly and conditions may be better (or worse) by your start date.

> Sharing a jeep is one of the easiest ways to cut costs. Find other trekkers heading to Langtang on the [Langtang region page](/langtang-region/).

We’ll update this page when the road to Syabrubesi reopens.
$body$,
  'route-updates', 'caution', array['langtang-region']::text[], array['langtang-valley','tamang-heritage-trail','gosaikunda']::text[],
  $t$Langtang Valley trail, Nepal$t$,
  $j$[{"title": "Annapurna Trekking – Nepal floods 2026 trekking update (updated 12 Oct 2026)", "url": "https://annapurnatrekking.com/blog/nepal-floods-2026-trekking-update"}]$j$::jsonb,
  false
) on conflict (slug) do nothing;


-- Update 26: "From our Facebook group" posts
-- Short partner requests you (the admin) summarise in your own words from the Facebook group.
-- They show on Find partners, the homepage and trek/region pages as separate cards marked
-- "From our Facebook group", posted by Trekking Partners Nepal, and link back to the original
-- group post. They never use the Facebook member's name or photo, and they aren't member posts:
-- nobody can reply or message on the site — the button sends people to Facebook.
--
-- Run once in Supabase: SQL Editor → New query → paste → Run (after departures.sql, which made is_admin()).
-- Safe to run again.

create table if not exists public.group_posts (
  id          uuid primary key default gen_random_uuid(),
  region      text not null,                 -- region slug, e.g. 'annapurna-region'
  trek        text not null,                 -- trek slug from src/data/treks.ts
  start_date  date not null,
  end_date    date,
  flexible    boolean not null default false,
  summary     text not null check (char_length(summary) between 20 and 600),
  fb_url      text not null check (fb_url ~* '^https://(www\.|m\.|web\.)?facebook\.com/groups/'),
  status      text not null default 'open' check (status in ('open', 'closed')),
  created_at  timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create index if not exists group_posts_latest_idx on public.group_posts (status, created_at desc);
create index if not exists group_posts_trek_idx   on public.group_posts (trek, start_date);

alter table public.group_posts enable row level security;

drop policy if exists "Group posts are public" on public.group_posts;
drop policy if exists "Admins add group posts" on public.group_posts;
drop policy if exists "Admins edit group posts" on public.group_posts;
drop policy if exists "Admins delete group posts" on public.group_posts;

create policy "Group posts are public"
  on public.group_posts for select using (true);
create policy "Admins add group posts"
  on public.group_posts for insert to authenticated with check (public.is_admin());
create policy "Admins edit group posts"
  on public.group_posts for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete group posts"
  on public.group_posts for delete to authenticated using (public.is_admin());

revoke all on public.group_posts from anon, authenticated;
grant select on public.group_posts to anon, authenticated;
grant insert, update, delete on public.group_posts to authenticated;

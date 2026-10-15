-- Trekking Partners Nepal – database setup
-- Run once in Supabase: SQL Editor → New query → paste → Run.

-- ── Profiles (one per signed-in user) ─────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  nationality  text,
  bio          text check (char_length(bio) <= 600),
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are public"
  on public.profiles for select using (true);
create policy "Users update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Create a profile automatically from the Google account on first sign-in
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Profiles for anyone who already signed in (e.g. via login-test)
insert into public.profiles (id, display_name, avatar_url)
select id,
       coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name'),
       raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) do nothing;

-- ── Trips (partner posts) ─────────────────────────────────────
create table if not exists public.trips (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  region        text not null,               -- region slug, e.g. 'annapurna-region'
  trek          text not null,               -- trek slug, e.g. 'annapurna-base-camp'
  start_date    date not null,
  end_date      date,
  flexible      boolean not null default false,
  group_size    smallint check (group_size between 1 and 20),
  pace          text check (pace in ('relaxed', 'steady', 'fast')),
  description   text not null check (char_length(description) between 20 and 1500),
  status        text not null default 'open' check (status in ('open', 'closed')),
  created_at    timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create index if not exists trips_latest_idx on public.trips (status, created_at desc);
create index if not exists trips_trek_idx   on public.trips (trek, start_date);

alter table public.trips enable row level security;

create policy "Trips are public"
  on public.trips for select using (true);
create policy "Signed-in users post their own trips"
  on public.trips for insert to authenticated with check (auth.uid() = user_id);
create policy "Users edit their own trips"
  on public.trips for update to authenticated using (auth.uid() = user_id);
create policy "Users delete their own trips"
  on public.trips for delete to authenticated using (auth.uid() = user_id);

-- ── Comments on trips ────────────────────────────────────────
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips(id) on delete cascade,
  user_id     uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 1000),
  created_at  timestamptz not null default now()
);

create index if not exists comments_trip_idx on public.comments (trip_id, created_at);

alter table public.comments enable row level security;

create policy "Comments are public"
  on public.comments for select using (true);
create policy "Signed-in users comment as themselves"
  on public.comments for insert to authenticated with check (auth.uid() = user_id);
create policy "Users delete their own comments"
  on public.comments for delete to authenticated using (auth.uid() = user_id);

-- Fixed departures + admin access
-- Run once in Supabase: SQL Editor → New query → paste → Run.
-- Sign in once on the site with Google BEFORE running this, so your account exists.

-- ── Admins ───────────────────────────────────────────────────
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.admins enable row level security;

create policy "Admins can see their own admin row"
  on public.admins for select to authenticated using (auth.uid() = user_id);

-- Make your Google account an admin. Change the email if you sign in with a different one.
insert into public.admins (user_id)
select id from auth.users where email = 'discoverparbat@gmail.com'
on conflict do nothing;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ── Departures ───────────────────────────────────────────────
create table if not exists public.departures (
  id          uuid primary key default gen_random_uuid(),
  trek        text not null,                 -- trek slug from src/data/treks.ts
  start_date  date not null,
  days        smallint not null check (days between 1 and 60),
  price       text,                          -- e.g. 'US$ 650'; empty = "Ask for price"
  group_max   smallint not null default 12 check (group_max between 1 and 50),
  seats_left  smallint not null default 12 check (seats_left >= 0),
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (seats_left <= group_max)
);

create index if not exists departures_start_idx on public.departures (published, start_date);

alter table public.departures enable row level security;

create policy "Published departures are public"
  on public.departures for select using (published or public.is_admin());
create policy "Admins add departures"
  on public.departures for insert to authenticated with check (public.is_admin());
create policy "Admins edit departures"
  on public.departures for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete departures"
  on public.departures for delete to authenticated using (public.is_admin());

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists departures_touch on public.departures;
create trigger departures_touch before update on public.departures
  for each row execute function public.touch_updated_at();

-- Your current departures (only added if the table is empty)
insert into public.departures (trek, start_date, days, group_max, seats_left)
select * from (values
  ('khopra-danda', date '2026-10-25', 9, 12, 12),
  ('kokhe-danda',  date '2026-10-28', 5, 12, 12),
  ('kokhe-danda',  date '2026-11-02', 5, 12, 12)
) as v(trek, start_date, days, group_max, seats_left)
where not exists (select 1 from public.departures);

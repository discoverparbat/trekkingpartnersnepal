-- Update 4: reports, bans and anti-spam limits
-- Run once in Supabase: SQL Editor → New query → paste → Run.
-- Safe to run again: it only adds or replaces things.

-- ── Reports ──────────────────────────────────────────────────
create table if not exists public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind         text not null check (kind in ('post', 'reply', 'profile')),
  target_id    uuid not null,              -- trips.id, comments.id or profiles.id
  reason       text not null check (reason in ('spam', 'scam', 'harassment', 'unsafe', 'other')),
  details      text check (char_length(details) <= 500),
  status       text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at   timestamptz not null default now(),
  unique (reporter_id, kind, target_id)    -- one report per person per item
);

create index if not exists reports_status_idx on public.reports (status, created_at desc);

alter table public.reports enable row level security;

drop policy if exists "Signed-in users report" on public.reports;
drop policy if exists "Admins read reports" on public.reports;
drop policy if exists "Admins update reports" on public.reports;
drop policy if exists "Admins delete reports" on public.reports;

create policy "Signed-in users report"
  on public.reports for insert to authenticated with check (auth.uid() = reporter_id);
create policy "Admins read reports"
  on public.reports for select to authenticated using (public.is_admin());
create policy "Admins update reports"
  on public.reports for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete reports"
  on public.reports for delete to authenticated using (public.is_admin());

-- Max 10 reports a day per person, so the report button can't be used to flood you.
create or replace function public.limit_reports()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.reports
      where reporter_id = new.reporter_id and created_at > now() - interval '1 day') >= 10 then
    raise exception 'You have sent a lot of reports today. Please email hello@trekkingpartnersnepal.com instead.';
  end if;
  return new;
end;
$$;

drop trigger if exists reports_limit on public.reports;
create trigger reports_limit before insert on public.reports
  for each row execute function public.limit_reports();

grant insert on public.reports to authenticated;
grant select, update, delete on public.reports to authenticated;

-- ── Bans ─────────────────────────────────────────────────────
-- A banned member can still sign in, but can't post, reply or read replies.
create table if not exists public.bans (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  reason     text check (char_length(reason) <= 300),
  created_at timestamptz not null default now()
);

alter table public.bans enable row level security;

drop policy if exists "Admins manage bans" on public.bans;
drop policy if exists "Users see their own ban" on public.bans;
create policy "Admins manage bans"
  on public.bans for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Users see their own ban"
  on public.bans for select to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.bans to authenticated;

create or replace function public.is_banned()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.bans where user_id = auth.uid());
$$;
grant execute on function public.is_banned() to anon, authenticated;

-- "Complete profile" now also means "not banned". Every post / reply rule already uses this.
create or replace function public.has_profile()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and display_name is not null and birth_year is not null and nationality is not null
  ) and not exists (select 1 from public.bans where user_id = auth.uid());
$$;

-- ── Anti-spam limits ─────────────────────────────────────────
-- Posts: max 3 new posts a day. Replies: max 20 an hour, and no identical reply twice on one post.
create or replace function public.limit_trips()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then return new; end if;
  if (select count(*) from public.trips
      where user_id = new.user_id and created_at > now() - interval '1 day') >= 3 then
    raise exception 'You can publish up to 3 posts a day. Please edit one of your existing posts instead.';
  end if;
  return new;
end;
$$;

drop trigger if exists trips_limit on public.trips;
create trigger trips_limit before insert on public.trips
  for each row execute function public.limit_trips();

create or replace function public.limit_comments()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then return new; end if;
  if (select count(*) from public.comments
      where user_id = new.user_id and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'You are replying very fast. Please wait a little and try again.';
  end if;
  if exists (select 1 from public.comments
             where user_id = new.user_id and trip_id = new.trip_id and body = new.body) then
    raise exception 'You already posted this reply.';
  end if;
  return new;
end;
$$;

drop trigger if exists comments_limit on public.comments;
create trigger comments_limit before insert on public.comments
  for each row execute function public.limit_comments();

-- ── Admin views ──────────────────────────────────────────────
-- Admins can read every reply, even on posts they don't own.
drop policy if exists "Admins read comments" on public.comments;
create policy "Admins read comments"
  on public.comments for select to authenticated using (public.is_admin());

-- Members list for the admin page (includes email, which is never public).
create or replace function public.admin_members()
returns table (
  id uuid, display_name text, avatar_url text, nationality text, email text,
  created_at timestamptz, posts int, replies int, banned boolean, complete boolean
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  return query
  select p.id, p.display_name, p.avatar_url, p.nationality, u.email::text,
         p.created_at,
         (select count(*)::int from public.trips t where t.user_id = p.id),
         (select count(*)::int from public.comments c where c.user_id = p.id),
         exists (select 1 from public.bans b where b.user_id = p.id),
         (p.display_name is not null and p.birth_year is not null and p.nationality is not null)
  from public.profiles p
  join auth.users u on u.id = p.id
  order by p.created_at desc;
end;
$$;

revoke all on function public.admin_members() from anon;
grant execute on function public.admin_members() to authenticated;

-- Profiles, partner posts and members-only comments
-- Run once in Supabase: SQL Editor → New query → paste → Run (after schema.sql and departures.sql).

-- ── Profile fields ───────────────────────────────────────────
alter table public.profiles add column if not exists birth_year smallint;
alter table public.profiles add column if not exists gender text;

alter table public.profiles drop constraint if exists profiles_gender_check;
alter table public.profiles add constraint profiles_gender_check
  check (gender is null or gender in ('female', 'male', 'non-binary'));
alter table public.profiles drop constraint if exists profiles_name_check;
alter table public.profiles add constraint profiles_name_check
  check (display_name is null or char_length(display_name) between 2 and 50);
alter table public.profiles drop constraint if exists profiles_nationality_check;
alter table public.profiles add constraint profiles_nationality_check
  check (nationality is null or char_length(nationality) <= 60);

-- Tidy input and enforce 18+
create or replace function public.validate_profile()
returns trigger language plpgsql as $$
begin
  new.display_name := nullif(btrim(new.display_name), '');
  new.nationality  := nullif(btrim(new.nationality), '');
  if new.birth_year is not null and
     (new.birth_year < 1920 or new.birth_year > extract(year from current_date)::int - 18) then
    raise exception 'You must be 18 or older to use Trekking Partners Nepal.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_validate on public.profiles;
create trigger profiles_validate before insert or update on public.profiles
  for each row execute function public.validate_profile();

-- A profile is "complete" when name, age and nationality are filled in
create or replace function public.has_profile()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and display_name is not null and birth_year is not null and nationality is not null
  );
$$;

-- ── Who can see profiles ─────────────────────────────────────
-- The full profile row (including birth year) is private to its owner.
drop policy if exists "Profiles are public" on public.profiles;
drop policy if exists "Users read their own profile" on public.profiles;
drop policy if exists "Users insert their own profile" on public.profiles;
drop policy if exists "Users update their own profile" on public.profiles;

create policy "Users read their own profile"
  on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users insert their own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users update their own profile"
  on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Everyone else sees this public version: age instead of birth year, no email.
create or replace view public.public_profiles as
select
  id,
  display_name,
  avatar_url,
  nationality,
  gender,
  case when birth_year is null then null
       else extract(year from current_date)::int - birth_year end as age,
  (display_name is not null and birth_year is not null and nationality is not null) as complete
from public.profiles;

-- ── Posts (trips) ────────────────────────────────────────────
drop policy if exists "Signed-in users post their own trips" on public.trips;
drop policy if exists "Users edit their own trips" on public.trips;
drop policy if exists "Admins delete any trip" on public.trips;

create policy "Members post their own trips"
  on public.trips for insert to authenticated
  with check (auth.uid() = user_id and public.has_profile());
create policy "Users edit their own trips"
  on public.trips for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Admins delete any trip"
  on public.trips for delete to authenticated using (public.is_admin());

-- ── Comments: readable only by members with a complete profile ──
drop policy if exists "Comments are public" on public.comments;
drop policy if exists "Members read comments" on public.comments;
drop policy if exists "Signed-in users comment as themselves" on public.comments;
drop policy if exists "Members comment as themselves" on public.comments;
drop policy if exists "Admins delete any comment" on public.comments;

create policy "Members read comments"
  on public.comments for select to authenticated using (public.has_profile());
create policy "Members comment as themselves"
  on public.comments for insert to authenticated
  with check (auth.uid() = user_id and public.has_profile());
create policy "Admins delete any comment"
  on public.comments for delete to authenticated using (public.is_admin());
drop policy if exists "Post owners delete replies on their posts" on public.comments;
create policy "Post owners delete replies on their posts"
  on public.comments for delete to authenticated
  using (exists (select 1 from public.trips where trips.id = comments.trip_id and trips.user_id = auth.uid()));

-- Reply counts are public, so visitors know a post has replies waiting.
create or replace view public.trip_comment_counts as
select trip_id, count(*)::int as replies from public.comments group by trip_id;

-- ── Permissions for the website (the rules above still apply) ──
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant insert (id, display_name, avatar_url, birth_year, gender, nationality) on public.profiles to authenticated;
grant update (display_name, birth_year, gender, nationality) on public.profiles to authenticated;

grant select on public.public_profiles to anon, authenticated;
grant select on public.trip_comment_counts to anon, authenticated;

revoke select on public.comments from anon;
grant select, insert, delete on public.comments to authenticated;

grant execute on function public.has_profile() to anon, authenticated;

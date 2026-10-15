-- Update 3: trekker profile pages + departure detail pages
-- Run once in Supabase: SQL Editor → New query → paste → Run.

-- "Member since" on public trekker profiles
create or replace view public.public_profiles as
select
  id,
  display_name,
  avatar_url,
  nationality,
  gender,
  case when birth_year is null then null
       else extract(year from current_date)::int - birth_year end as age,
  (display_name is not null and birth_year is not null and nationality is not null) as complete,
  created_at
from public.profiles;

grant select on public.public_profiles to anon, authenticated;

-- Details for each fixed departure (all optional)
alter table public.departures add column if not exists overview      text check (char_length(overview) <= 2000);
alter table public.departures add column if not exists itinerary     text check (char_length(itinerary) <= 6000);
alter table public.departures add column if not exists included      text check (char_length(included) <= 3000);
alter table public.departures add column if not exists not_included  text check (char_length(not_included) <= 3000);
alter table public.departures add column if not exists meeting_point text check (char_length(meeting_point) <= 300);

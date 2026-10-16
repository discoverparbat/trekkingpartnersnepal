-- Update 6: short bio on trekker profiles (shown only on the profile page)
-- Run once in Supabase: SQL Editor → New query → paste → Run. Safe to run again.

alter table public.profiles add column if not exists bio text;
alter table public.profiles drop constraint if exists profiles_bio_check;
alter table public.profiles add constraint profiles_bio_check check (bio is null or char_length(bio) <= 300);

grant update (bio) on public.profiles to authenticated;

-- Tidy input: trim spaces, store empty as null
create or replace function public.validate_profile()
returns trigger language plpgsql as $$
begin
  new.display_name := nullif(btrim(new.display_name), '');
  new.nationality  := nullif(btrim(new.nationality), '');
  new.bio          := nullif(btrim(new.bio), '');
  if new.birth_year is not null and
     (new.birth_year < 1920 or new.birth_year > extract(year from current_date)::int - 18) then
    raise exception 'You must be 18 or older to use Trekking Partners Nepal.';
  end if;
  return new;
end;
$$;

-- Public profile now includes the bio (added at the end so existing columns stay the same)
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
  created_at,
  bio
from public.profiles;

grant select on public.public_profiles to anon, authenticated;

-- Update 13: no public member list
-- Before: the public_profiles view let anyone with the site's public key download every member at once
--         (name, photo, nationality, gender, age), including people who never posted.
-- After:  profiles can only be looked up a few at a time, by id, and only for members who are already
--         visible on the site (they have a partner post, reply, question or answer). Nobody can list
--         all members, and members who haven't posted stay hidden. Emails were never public and still aren't.
--
-- Also clears Supabase's "Security Definer View" warning on public_profiles.
--
-- Run once in Supabase: SQL Editor → New query → paste → Run (after update-10-community.sql).
-- Safe to run again.

-- ── Look up profiles by id (max 50 per call) ─────────────────
create or replace function public.member_profiles(ids uuid[])
returns table (
  id uuid, display_name text, avatar_url text, nationality text, gender text,
  age int, complete boolean, created_at timestamptz, bio text
)
language sql stable security definer set search_path = public as $$
  select p.id, p.display_name, p.avatar_url, p.nationality, p.gender,
         case when p.birth_year is null then null
              else extract(year from current_date)::int - p.birth_year end,
         (p.display_name is not null and p.birth_year is not null and p.nationality is not null),
         p.created_at, p.bio
  from public.profiles p
  where p.id = any (ids[1:50])
    and (
      p.id = auth.uid()
      or public.is_admin()
      or exists (select 1 from public.trips t where t.user_id = p.id)
      or exists (select 1 from public.comments c where c.user_id = p.id)
      or exists (select 1 from public.questions q where q.user_id = p.id and q.status <> 'moved')
      or exists (select 1 from public.answers a where a.user_id = p.id)
    );
$$;

revoke all on function public.member_profiles(uuid[]) from public;
grant execute on function public.member_profiles(uuid[]) to anon, authenticated;

-- ── Close the old view ───────────────────────────────────────
-- It now follows the profiles table's own rules: each member sees only their own row,
-- visitors see nothing. The site uses member_profiles() instead.
alter view public.public_profiles set (security_invoker = true);
revoke select on public.public_profiles from anon;
grant select on public.public_profiles to authenticated;

-- Update 12: site announcements in the bell
--   • a new notification kind, 'announcement', with its own headline, text and link
--   • public.announce(headline, text, link) sends one to every member (admins only)
--   • sends the first one: the new Community and trek alerts
--
-- Run once in Supabase: SQL Editor → New query → paste → Run.
-- Run it AFTER update-10-community.sql. Safe to run again: the launch announcement is only sent once.

alter table public.notifications add column if not exists title text check (char_length(title) <= 120);
alter table public.notifications add column if not exists body  text check (char_length(body) <= 400);
alter table public.notifications add column if not exists link  text check (link is null or (link like '/%' and link not like '//%'));

alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('welcome', 'first_post', 'reply', 'thread_reply',
                  'answer', 'thread_answer', 'best_answer', 'moved_to_partners', 'announcement'));

-- Send an announcement to every member who isn't banned. Returns how many were sent.
-- Works for admins signed in on the site, and from the Supabase SQL Editor.
create or replace function public.announce(p_title text, p_body text, p_link text default '/')
returns int language plpgsql security definer set search_path = public as $$
declare
  n int;
begin
  -- Signed-in members always have an auth.uid(); only admins among them may send.
  -- No auth.uid() means the SQL Editor or the service role (visitors can't call this at all).
  if auth.uid() is not null and not public.is_admin() then
    raise exception 'Admins only';
  end if;
  insert into public.notifications (user_id, kind, title, body, link)
  select p.id, 'announcement', left(btrim(p_title), 120), left(btrim(p_body), 400), nullif(btrim(p_link), '')
  from public.profiles p
  where not exists (select 1 from public.bans b where b.user_id = p.id);
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.announce(text, text, text) from public, anon;
grant execute on function public.announce(text, text, text) to authenticated;

-- ── The launch announcement (sent once) ──────────────────────
do $$
begin
  if not exists (select 1 from public.notifications
                 where kind = 'announcement' and title = 'New: Community Q&A and trek alerts') then
    perform public.announce(
      'New: Community Q&A and trek alerts',
      'Ask about trail conditions, permits, gear and teahouses – trekkers who were just there and our local team answer. Closures and trail updates now also show on each trek page.',
      '/community/'
    );
  end if;
end $$;

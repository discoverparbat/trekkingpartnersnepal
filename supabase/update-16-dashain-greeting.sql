-- Update 16: Happy Vijaya Dashami greeting in every member's bell (Oct 2026)
-- Uses public.announce() from update-12-announcements.sql.
--
-- Run once in Supabase: SQL Editor → New query → paste → Run.
-- Safe to run again: the greeting is only sent once.

do $$
begin
  if not exists (select 1 from public.notifications
                 where kind = 'announcement' and title = 'Happy Vijaya Dashami! 🌼') then
    perform public.announce(
      'Happy Vijaya Dashami! 🌼',
      'Wishing you and your loved ones a joyful Dashain from all of us at Trekking Partners Nepal. It''s also the heart of autumn trekking season – clear mountain views and lively trails. Buses and offices get busy or close for a few days, so plan travel early. Looking for company on the trail? Find a trekking partner today.',
      '/find-partners/'
    );
  end if;
end $$;

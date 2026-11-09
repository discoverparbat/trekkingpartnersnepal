-- Update 25: Happy Tihar greeting (Laxmi Puja, 9 Nov 2026)
--   • a bell announcement for every member (uses public.announce() from update-12)
--   • the "tihar-2083" news email (uses public.send_news_email() from update-17)
-- The bell links to /tihar/, which redirects to the Discover Parbat Tihar article (public/_redirects).
--
-- Before running: deploy the updated supabase/functions/news-email/index.ts as "news-email"
-- (it now includes the tihar-2083 campaign).
-- Run once in Supabase: SQL Editor → New query → paste → Run.
-- Safe to run again: the bell notice is only sent once, and nobody gets the email twice.

do $$
begin
  if not exists (select 1 from public.notifications
                 where kind = 'announcement' and title = 'Happy Tihar! 🪔 शुभ दीपावली') then
    perform public.announce(
      'Happy Tihar! 🪔 शुभ दीपावली',
      'Wishing you and your loved ones a bright, joyful Tihar from all of us at Trekking Partners Nepal. Tonight is Laxmi Puja, when homes glow with oil lamps and marigolds, and Bhai Tika is on Wednesday 11 Nov. Read what each of the five days means.',
      '/tihar/'
    );
  end if;
end $$;

select public.send_news_email('tihar-2083');

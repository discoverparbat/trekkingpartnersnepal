-- Update 18: Cyclone Arnab weather alert (Oct 2026)
--   • a bell announcement for every member (uses public.announce() from update-12)
--   • the "cyclone-arnab-2083" news email (uses public.send_news_email() from update-17)
-- The bell links to /weather-alert/, which redirects to the Discover Parbat article (public/_redirects).
--
-- Before running: deploy the updated supabase/functions/news-email/index.ts as "news-email"
-- (it now includes the cyclone-arnab-2083 campaign).
-- Run once in Supabase: SQL Editor → New query → paste → Run.
-- Safe to run again: the bell notice is only sent once, and nobody gets the email twice.

do $$
begin
  if not exists (select 1 from public.notifications
                 where kind = 'announcement' and title = '⚠️ Weather alert: Cyclone Arnab, 28–31 Oct') then
    perform public.announce(
      '⚠️ Weather alert: Cyclone Arnab, 28–31 Oct',
      'Heavy rain in the hills and 0.25–1.5 m of snow in the high Himalaya from Wednesday afternoon to Saturday, worst Thursday night to Friday. Pause high treks and pass crossings; if you''re on the trail, be at a safe, lower village by Wednesday evening. Clearing from Sunday 1 Nov.',
      '/weather-alert/'
    );
  end if;
end $$;

select public.send_news_email('cyclone-arnab-2083');

-- Update 21: "storm has passed" weather update (1 Nov 2026)
--   • a bell announcement for every member (uses public.announce() from update-12)
-- The bell links to /weather-update/, which redirects to the Discover Parbat article
-- "Nepal Weather in November 2026 After Cyclone Arnab" (public/_redirects).
-- No email is sent with this one.
--
-- Run once in Supabase: SQL Editor → New query → paste → Run.
-- Safe to run again: the bell notice is only sent once.

do $$
begin
  if not exists (select 1 from public.notifications
                 where kind = 'announcement' and title = '☀️ Cyclone Arnab has passed: clear skies are back') then
    perform public.announce(
      '☀️ Cyclone Arnab has passed: clear skies are back',
      'Classic November weather has returned: clear mornings, sunrise above a sea of clouds and starry nights. See the daily cloud pattern, the best ridges for views, and what to check before crossing a high pass after the fresh snow.',
      '/weather-update/'
    );
  end if;
end $$;

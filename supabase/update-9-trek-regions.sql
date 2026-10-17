-- Update 9: Makalu Base Camp moved to Eastern Nepal, Dhaulagiri Circuit to the new Dhaulagiri region.
-- Moves existing partner posts for those treks so they show on the right region pages.
-- Run once in Supabase: SQL Editor → New query → paste → Run. Safe to run again.

update public.trips set region = 'eastern-nepal'     where trek = 'makalu-base-camp'   and region <> 'eastern-nepal';
update public.trips set region = 'dhaulagiri-region' where trek = 'dhaulagiri-circuit' and region <> 'dhaulagiri-region';

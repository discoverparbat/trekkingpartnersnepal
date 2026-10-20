-- Update 11: link an admin note to one trek
-- A note with a trek (e.g. "Thorong La closed" → annapurna-circuit) also shows as a warning
-- banner on that trek's page and on its partner posts. Notes without a trek work as before.
--
-- Run once in Supabase: SQL Editor → New query → paste → Run.
-- Run it AFTER update-10-community.sql. Safe to run again.

alter table public.admin_notes add column if not exists trek text;

alter table public.admin_notes drop constraint if exists admin_notes_trek_check;
alter table public.admin_notes add constraint admin_notes_trek_check
  check (trek is null or char_length(trek) between 2 and 80);

create index if not exists admin_notes_trek_idx on public.admin_notes (trek, created_at desc) where trek is not null;

grant insert (trek), update (trek) on public.admin_notes to authenticated;

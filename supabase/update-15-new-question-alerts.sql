-- Update 15: tell admins about every new Community question (bell notification)
-- Each admin gets a "new question" notification, except the admin who asked it.
-- Opening the question marks it as read.
--
-- Run once in Supabase: SQL Editor → New query → paste → Run (after update-12-announcements.sql).
-- Safe to run again.

alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('welcome', 'first_post', 'reply', 'thread_reply',
                  'answer', 'thread_answer', 'best_answer', 'moved_to_partners', 'announcement',
                  'new_question'));

create or replace function public.notify_new_question()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, kind, question_id, actor_id)
  select a.user_id, 'new_question', new.id, new.user_id
  from public.admins a
  join public.profiles p on p.id = a.user_id
  where a.user_id <> new.user_id;
  return new;
exception when others then
  return new;   -- a notification problem must never stop a question being posted
end;
$$;

drop trigger if exists questions_notify_admins on public.questions;
create trigger questions_notify_admins after insert on public.questions
  for each row execute function public.notify_new_question();

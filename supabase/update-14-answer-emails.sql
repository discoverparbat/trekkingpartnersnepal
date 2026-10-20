-- Update 14: email the asker when their Community question gets an answer
-- Sends through the new "answer-alert" Edge Function, once per new "answer" bell notification.
-- More answers while that notification is unread are grouped on the site and don't send more emails.
-- Respects each member's existing "reply emails" setting and unsubscribe link.
--
-- Run once in Supabase: SQL Editor → New query → paste → Run.
-- Run it AFTER the "answer-alert" Edge Function is deployed, and after update-10-community.sql. Safe to run again.

create or replace function public.email_answer_notification()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  s text;
begin
  select decrypted_secret into s from vault.decrypted_secrets where name = 'reply_alert_secret' limit 1;
  perform net.http_post(
    url     := 'https://waorryrsgdfvhujreuvq.supabase.co/functions/v1/answer-alert',
    body    := jsonb_build_object('notification_id', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-alert-secret', coalesce(s, ''))
  );
  return new;
exception when others then
  return new;   -- an email problem must never stop an answer being posted
end;
$$;

drop trigger if exists notifications_email_answer on public.notifications;
create trigger notifications_email_answer after insert on public.notifications
  for each row when (new.kind = 'answer')
  execute function public.email_answer_notification();

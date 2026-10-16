-- Update 5: email alerts when someone replies
-- Run once in Supabase: SQL Editor → New query → paste → Run.
-- Run it AFTER the "reply-alert" Edge Function is deployed. Safe to run again.

create extension if not exists pg_net;

-- ── Email settings on each profile ───────────────────────────
alter table public.profiles add column if not exists email_replies boolean not null default true;
alter table public.profiles add column if not exists unsub_token uuid not null default gen_random_uuid();

grant update (email_replies) on public.profiles to authenticated;

-- One-click unsubscribe from the link in the email (no sign-in needed)
create or replace function public.unsubscribe_replies(token uuid)
returns boolean language sql security definer set search_path = public as $$
  with u as (update public.profiles set email_replies = false where unsub_token = token returning 1)
  select exists (select 1 from u);
$$;
grant execute on function public.unsubscribe_replies(uuid) to anon, authenticated;

-- ── Log of alert emails (used to avoid sending too many) ─────
create table if not exists public.reply_emails (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  trip_id     uuid not null references public.trips(id) on delete cascade,
  comment_id  uuid not null,
  sent_at     timestamptz not null default now()
);
create index if not exists reply_emails_recent_idx on public.reply_emails (user_id, trip_id, sent_at desc);
alter table public.reply_emails enable row level security;   -- no policies: only the Edge Function (service role) uses it

-- ── Shared secret so only this database can trigger emails ───
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'reply_alert_secret') then
    perform vault.create_secret(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'reply_alert_secret');
  end if;
end $$;

create or replace function public.check_alert_secret(s text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from vault.decrypted_secrets where name = 'reply_alert_secret' and decrypted_secret = s);
$$;
revoke all on function public.check_alert_secret(text) from public, anon, authenticated;
grant execute on function public.check_alert_secret(text) to service_role;

-- ── After every new reply, ask the Edge Function to send alerts ──
create or replace function public.notify_reply()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  s text;
begin
  select decrypted_secret into s from vault.decrypted_secrets where name = 'reply_alert_secret' limit 1;
  perform net.http_post(
    url     := 'https://waorryrsgdfvhujreuvq.supabase.co/functions/v1/reply-alert',
    body    := jsonb_build_object('comment_id', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-alert-secret', coalesce(s, ''))
  );
  return new;
exception when others then
  return new;   -- an email problem must never stop a reply being posted
end;
$$;

drop trigger if exists comments_notify on public.comments;
create trigger comments_notify after insert on public.comments
  for each row execute function public.notify_reply();

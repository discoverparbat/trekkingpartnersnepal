-- Update 8: on-site notifications (the bell in the header)
--   • Welcome message when someone creates an account
--   • "Your first post is live" when they publish their first trek post
--   • Reply notifications for the post owner and everyone who replied before
-- Also sends a welcome email and a first-post email through the "member-email" Edge Function.
--
-- Run once in Supabase: SQL Editor → New query → paste → Run.
-- Run it AFTER update-5-reply-alerts.sql and AFTER the "member-email" Edge Function is deployed.
-- Safe to run again.

-- ── Table ────────────────────────────────────────────────────
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,   -- who sees it
  kind        text not null check (kind in ('welcome', 'first_post', 'reply', 'thread_reply')),
  trip_id     uuid references public.trips(id) on delete set null,
  comment_id  uuid references public.comments(id) on delete cascade,             -- latest reply (a deleted reply removes it)
  actor_id    uuid references public.profiles(id) on delete set null,            -- who replied
  count       int  not null default 1,                                           -- replies grouped since last read
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications (user_id, trip_id, kind) where read_at is null;
-- Only ever one welcome and one first-post message per person
create unique index if not exists notifications_one_welcome on public.notifications (user_id) where kind = 'welcome';
create unique index if not exists notifications_one_first_post on public.notifications (user_id) where kind = 'first_post';

alter table public.notifications enable row level security;

drop policy if exists "Users read their own notifications" on public.notifications;
drop policy if exists "Users mark their own notifications read" on public.notifications;
drop policy if exists "Users delete their own notifications" on public.notifications;

create policy "Users read their own notifications"
  on public.notifications for select to authenticated using (auth.uid() = user_id);
create policy "Users mark their own notifications read"
  on public.notifications for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete their own notifications"
  on public.notifications for delete to authenticated using (auth.uid() = user_id);

-- Members can only read, mark as read, or clear. New ones are made by the triggers below.
revoke all on public.notifications from anon, authenticated;
grant select, delete on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

-- ── 1. Welcome, on account creation ──────────────────────────
create or replace function public.notify_welcome()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, kind) values (new.id, 'welcome') on conflict do nothing;
  return new;
exception when others then
  return new;   -- a notification problem must never stop sign-up
end;
$$;

drop trigger if exists profiles_notify_welcome on public.profiles;
create trigger profiles_notify_welcome after insert on public.profiles
  for each row execute function public.notify_welcome();

-- ── 2. First post ────────────────────────────────────────────
create or replace function public.notify_first_post()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.trips where user_id = new.user_id and id <> new.id) then
    insert into public.notifications (user_id, kind, trip_id) values (new.user_id, 'first_post', new.id)
    on conflict do nothing;
  end if;
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists trips_notify_first_post on public.trips;
create trigger trips_notify_first_post after insert on public.trips
  for each row execute function public.notify_first_post();

-- ── 3. Replies ───────────────────────────────────────────────
-- Tells the post owner ('reply') and earlier repliers ('thread_reply'), never the person replying.
-- While a notification is unread, new replies on the same post are added to it ("3 new replies").
create or replace function public.notify_reply_inapp()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  owner uuid;
  r uuid;
  k text;
begin
  select user_id into owner from public.trips where id = new.trip_id;
  if owner is null then return new; end if;

  for r in
    select x.uid from (
      select owner as uid
      union
      select c.user_id from public.comments c where c.trip_id = new.trip_id
    ) x
    where x.uid <> new.user_id
      and not exists (select 1 from public.bans b where b.user_id = x.uid)
  loop
    k := case when r = owner then 'reply' else 'thread_reply' end;
    update public.notifications
       set count = count + 1, actor_id = new.user_id, comment_id = new.id, created_at = now()
     where user_id = r and trip_id = new.trip_id and kind = k and read_at is null;
    if not found then
      insert into public.notifications (user_id, kind, trip_id, comment_id, actor_id)
      values (r, k, new.trip_id, new.id, new.user_id);
    end if;
  end loop;
  return new;
exception when others then
  return new;   -- a notification problem must never stop a reply being posted
end;
$$;

drop trigger if exists comments_notify_inapp on public.comments;
create trigger comments_notify_inapp after insert on public.comments
  for each row execute function public.notify_reply_inapp();

-- ── Welcome + first-post emails ──────────────────────────────
-- Uses the same secret as the reply emails (created in update 5).
create or replace function public.email_member_notification()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  s text;
begin
  select decrypted_secret into s from vault.decrypted_secrets where name = 'reply_alert_secret' limit 1;
  perform net.http_post(
    url     := 'https://waorryrsgdfvhujreuvq.supabase.co/functions/v1/member-email',
    body    := jsonb_build_object('notification_id', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-alert-secret', coalesce(s, ''))
  );
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists notifications_email on public.notifications;
create trigger notifications_email after insert on public.notifications
  for each row when (new.kind in ('welcome', 'first_post'))
  execute function public.email_member_notification();

-- ── Live updates for the bell ────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
exception when others then
  null;   -- realtime not available: the bell still updates on every page load
end $$;

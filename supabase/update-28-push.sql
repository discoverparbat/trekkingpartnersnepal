-- Update 28: phone & computer notifications (Web Push)
-- ─────────────────────────────────────────────────────────────
-- Every 🔔 bell notification and every new private message also pops up on the member's phone or
-- computer, like an app notification – even when the site is closed. Members switch it on per device
-- (bell panel or My account). Sent by the "push-send" Edge Function.
-- Needs updates 5 (alert secret), 8 (notifications) and 22/24 (messages). Safe to run more than once.

-- ── Devices that turned notifications on ─────────────────────
create table if not exists public.push_subscriptions (
  endpoint    text primary key check (endpoint like 'https://%' and char_length(endpoint) < 1000),
  user_id     uuid not null references auth.users on delete cascade,
  p256dh      text not null check (char_length(p256dh) < 200),
  auth        text not null check (char_length(auth) < 100),
  user_agent  text check (char_length(user_agent) < 300),
  created_at  timestamptz not null default now()
);
create index if not exists push_subscriptions_user on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;
-- No policies: members only go through the two functions below, so nobody can read anyone's devices.
revoke all on public.push_subscriptions from anon, authenticated;

-- Save this device for the signed-in member. A shared device moves to whoever signed in last.
create or replace function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text, p_user_agent text default null)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'not signed in'; end if;
  insert into public.push_subscriptions (endpoint, user_id, p256dh, auth, user_agent)
  values (p_endpoint, me, p_p256dh, p_auth, left(p_user_agent, 290))
  on conflict (endpoint) do update
    set user_id = me, p256dh = excluded.p256dh, auth = excluded.auth,
        user_agent = excluded.user_agent, created_at = now();
  -- At most 10 devices per member (oldest dropped)
  delete from public.push_subscriptions
   where user_id = me
     and endpoint not in (select x.endpoint from public.push_subscriptions x
                          where x.user_id = me order by x.created_at desc limit 10);
end;
$$;

create or replace function public.remove_push_subscription(p_endpoint text)
returns void language sql security definer set search_path = public as $$
  delete from public.push_subscriptions where endpoint = p_endpoint and user_id = auth.uid();
$$;

revoke execute on function public.save_push_subscription(text, text, text, text), public.remove_push_subscription(text) from public, anon;
grant execute on function public.save_push_subscription(text, text, text, text), public.remove_push_subscription(text) to authenticated;

-- ── Calling the Edge Function ────────────────────────────────
create or replace function public.call_push(payload jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare s text;
begin
  -- Nobody to send to? Don't call the function at all.
  if not exists (select 1 from public.push_subscriptions where user_id = (payload->>'user_id')::uuid) then return; end if;
  select decrypted_secret into s from vault.decrypted_secrets where name = 'reply_alert_secret' limit 1;
  perform net.http_post(
    url     := 'https://waorryrsgdfvhujreuvq.supabase.co/functions/v1/push-send',
    body    := payload - 'user_id',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-alert-secret', coalesce(s, ''))
  );
exception when others then null;   -- a push problem must never stop anything else
end;
$$;
revoke execute on function public.call_push(jsonb) from public, anon, authenticated;

-- Every bell notification: new ones, and grouped ones getting another reply/answer ("3 new replies")
create or replace function public.push_notification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.call_push(jsonb_build_object('notification_id', new.id, 'user_id', new.user_id));
  return new;
exception when others then return new;
end;
$$;
drop trigger if exists notifications_push on public.notifications;
create trigger notifications_push after insert or update of count on public.notifications
  for each row when (new.read_at is null) execute function public.push_notification();

-- Every private message
create or replace function public.push_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare recipient uuid;
begin
  select case when c.user_a = new.sender_id then c.user_b else c.user_a end into recipient
    from public.conversations c where c.id = new.conversation_id;
  if recipient is not null then
    perform public.call_push(jsonb_build_object('message_id', new.id, 'user_id', recipient));
  end if;
  return new;
exception when others then return new;
end;
$$;
drop trigger if exists messages_push on public.messages;
create trigger messages_push after insert on public.messages
  for each row execute function public.push_message();

revoke execute on function public.push_notification(), public.push_message() from public, anon, authenticated;

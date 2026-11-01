-- Update 22: end-to-end encrypted one-to-one messages
-- ─────────────────────────────────────────────────────────────
-- • Members message each other one-to-one, starting from a partner post (the author or someone who replied).
-- • Messages are encrypted in the browser. The database only ever stores ciphertext; nobody here,
--   admins included, can read it. Reports carry an excerpt that the reporter's own device decrypted.
-- • A member can start conversations with at most 5 new people per 24 hours (replies are unlimited).
--   Trying a 6th sends every admin a 🔔 alert.
-- • Block and report in every chat. Blocking stops messages both ways.
-- • Email alert for new messages: at most one per conversation every 3 hours, only if the person hasn't
--   just been reading that chat, and only if reply emails are on (same unsubscribe link).
-- Needs updates 4, 5, 8, 10 and 13 first. Safe to run more than once.

-- ── Encryption keys ──────────────────────────────────────────
-- Every key a member has ever published (public part only). Old ones are kept so the other person
-- can still read earlier messages after a key reset.
create table if not exists public.message_public_keys (
  key_id     uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  public_jwk jsonb not null check (octet_length(public_jwk::text) < 1000),
  created_at timestamptz not null default now()
);
create index if not exists message_public_keys_user on public.message_public_keys (user_id, created_at desc);
alter table public.message_public_keys enable row level security;

-- The member's current key: public key id plus the private key, encrypted with their messages password
-- in their browser (PBKDF2 + AES-GCM). We can't decrypt it.
create table if not exists public.message_keys (
  user_id      uuid primary key references auth.users on delete cascade,
  key_id       uuid not null references public.message_public_keys on delete cascade,
  wrapped_key  text not null check (char_length(wrapped_key) < 2000),
  salt         text not null check (char_length(salt) < 100),
  iv           text not null check (char_length(iv) < 100),
  iterations   int  not null check (iterations between 100000 and 5000000),
  updated_at   timestamptz not null default now()
);
alter table public.message_keys enable row level security;
drop policy if exists "Users read their own message key" on public.message_keys;
create policy "Users read their own message key"
  on public.message_keys for select to authenticated using (user_id = auth.uid());

-- ── Conversations, messages, blocks ──────────────────────────
create table if not exists public.conversations (
  id              uuid primary key default gen_random_uuid(),
  user_a          uuid not null references auth.users on delete cascade,   -- user_a < user_b
  user_b          uuid not null references auth.users on delete cascade,
  started_by      uuid not null references auth.users on delete cascade,
  trip_id         uuid references public.trips on delete set null,
  created_at      timestamptz not null default now(),
  last_message_at timestamptz,
  a_read_at       timestamptz,
  b_read_at       timestamptz,
  check (user_a < user_b),
  unique (user_a, user_b)
);
create index if not exists conversations_b on public.conversations (user_b);
create index if not exists conversations_started on public.conversations (started_by, created_at desc);
alter table public.conversations enable row level security;
drop policy if exists "Members read their own conversations" on public.conversations;
create policy "Members read their own conversations"
  on public.conversations for select to authenticated using (auth.uid() in (user_a, user_b));
-- No insert/update/delete policies: conversations are only changed through the functions below.

create table if not exists public.message_blocks (
  blocker_id uuid not null default auth.uid() references auth.users on delete cascade,
  blocked_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
alter table public.message_blocks enable row level security;
drop policy if exists "Members see their own blocks" on public.message_blocks;
create policy "Members see their own blocks"
  on public.message_blocks for select to authenticated using (blocker_id = auth.uid());
drop policy if exists "Members block" on public.message_blocks;
create policy "Members block"
  on public.message_blocks for insert to authenticated with check (blocker_id = auth.uid());
drop policy if exists "Members unblock" on public.message_blocks;
create policy "Members unblock"
  on public.message_blocks for delete to authenticated using (blocker_id = auth.uid());

create or replace function public.is_message_blocked(x uuid, y uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.message_blocks
                 where (blocker_id = x and blocked_id = y) or (blocker_id = y and blocked_id = x));
$$;
revoke execute on function public.is_message_blocked(uuid, uuid) from public, anon;

create table if not exists public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations on delete cascade,
  sender_id        uuid not null default auth.uid() references auth.users on delete cascade,
  sender_key_id    uuid not null,
  recipient_key_id uuid not null,
  ciphertext       text not null check (char_length(ciphertext) between 1 and 8000),
  iv               text not null check (char_length(iv) < 50),
  created_at       timestamptz not null default now()
);
create index if not exists messages_conversation on public.messages (conversation_id, created_at desc);
create index if not exists messages_sender_recent on public.messages (sender_id, created_at desc);
alter table public.messages enable row level security;

create or replace function public.in_conversation(c uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.conversations where id = c and auth.uid() in (user_a, user_b));
$$;
grant execute on function public.in_conversation(uuid) to authenticated;

drop policy if exists "Members read messages in their conversations" on public.messages;
create policy "Members read messages in their conversations"
  on public.messages for select to authenticated using (public.in_conversation(conversation_id));
drop policy if exists "Members send messages" on public.messages;
create policy "Members send messages"
  on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and public.has_profile()                               -- complete profile, not banned
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b)
        and not public.is_message_blocked(c.user_a, c.user_b)
    )
    and sender_key_id = (select key_id from public.message_keys where user_id = auth.uid())
  );

-- Public keys: your own, and those of people you share a conversation with.
drop policy if exists "Members read keys of their contacts" on public.message_public_keys;
create policy "Members read keys of their contacts"
  on public.message_public_keys for select to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.conversations c
               where (c.user_a = auth.uid() and c.user_b = message_public_keys.user_id)
                  or (c.user_b = auth.uid() and c.user_a = message_public_keys.user_id))
  );

-- ── Notifications: new kinds ─────────────────────────────────
alter table public.notifications add column if not exists conversation_id uuid references public.conversations on delete cascade;
alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('welcome', 'first_post', 'reply', 'thread_reply', 'answer', 'thread_answer', 'best_answer',
                  'moved_to_partners', 'announcement', 'new_question', 'message_invite', 'admin_alert'));

-- 🔔 to every admin (once per `dedupe` key per 12 hours)
create or replace function public.alert_admins(t text, b text, l text, actor uuid default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.notifications
             where kind = 'admin_alert' and title = left(t, 120)
               and actor_id is not distinct from actor
               and created_at > now() - interval '12 hours') then
    return;
  end if;
  insert into public.notifications (user_id, kind, title, body, link, actor_id)
  select a.user_id, 'admin_alert', left(t, 120), left(b, 400), l, actor from public.admins a;
end;
$$;
revoke execute on function public.alert_admins(text, text, text, uuid) from public, anon, authenticated;

-- Called by the Edge Functions (service role) when Resend refuses an email because a plan limit was reached.
create or replace function public.flag_email_limit()
returns void language sql security definer set search_path = public as $$
  select public.alert_admins(
    'Email limit reached',
    'Resend refused an email because the plan’s daily or monthly limit was reached. Check resend.com → Usage, and consider the Pro plan.',
    '/admin/', null);
$$;
revoke execute on function public.flag_email_limit() from public, anon, authenticated;
grant execute on function public.flag_email_limit() to service_role;

-- ── Functions used by the site ───────────────────────────────
-- Publish a new key (first setup or reset). The private part arrives already encrypted.
create or replace function public.set_message_key(public_jwk jsonb, wrapped_key text, salt text, iv text, iterations int)
returns uuid language plpgsql security definer set search_path = public as $$
declare k uuid;
begin
  if not public.has_profile() then raise exception 'Complete your profile first.'; end if;
  insert into public.message_public_keys (user_id, public_jwk) values (auth.uid(), public_jwk) returning key_id into k;
  insert into public.message_keys (user_id, key_id, wrapped_key, salt, iv, iterations)
  values (auth.uid(), k, wrapped_key, salt, iv, iterations)
  on conflict (user_id) do update
    set key_id = excluded.key_id, wrapped_key = excluded.wrapped_key, salt = excluded.salt,
        iv = excluded.iv, iterations = excluded.iterations, updated_at = now();
  return k;
end;
$$;
grant execute on function public.set_message_key(jsonb, text, text, text, int) to authenticated;

-- Start (or reopen) a conversation. Returns {"id": …} or {"error": "limit" | "blocked" | "self" | "profile" | "unavailable"}.
create or replace function public.start_conversation(other uuid, trip uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  a uuid; b uuid;
  existing uuid;
  started int;
  myname text;
  newid uuid;
begin
  if me is null or not public.has_profile() then return jsonb_build_object('error', 'profile'); end if;
  if other = me then return jsonb_build_object('error', 'self'); end if;
  if not exists (select 1 from public.profiles p
                 where p.id = other and p.display_name is not null and p.birth_year is not null and p.nationality is not null)
     or exists (select 1 from public.bans where user_id = other) then
    return jsonb_build_object('error', 'unavailable');
  end if;
  a := least(me, other); b := greatest(me, other);
  select id into existing from public.conversations where user_a = a and user_b = b;
  if existing is not null then
    if public.is_message_blocked(me, other) then return jsonb_build_object('error', 'blocked', 'id', existing); end if;
    return jsonb_build_object('id', existing);
  end if;
  if public.is_message_blocked(me, other) then return jsonb_build_object('error', 'blocked'); end if;

  if not public.is_admin() then
    select count(*) into started from public.conversations where started_by = me and created_at > now() - interval '24 hours';
    if started >= 5 then
      select display_name into myname from public.profiles where id = me;
      perform public.alert_admins(
        'Messaging limit hit',
        coalesce(myname, 'A member') || ' tried to message more than 5 new people in 24 hours. Check their profile for spam.',
        '/trekker/?id=' || me::text, me);
      return jsonb_build_object('error', 'limit');
    end if;
  end if;

  insert into public.conversations (user_a, user_b, started_by, trip_id)
  values (a, b, me, case when exists (select 1 from public.trips where id = trip) then trip end)
  returning id into newid;
  return jsonb_build_object('id', newid);
end;
$$;
grant execute on function public.start_conversation(uuid, uuid) to authenticated;

-- My conversations, newest first
create or replace function public.my_conversations()
returns table (id uuid, other_id uuid, trip_id uuid, created_at timestamptz, last_message_at timestamptz,
               unread boolean, blocked_by_me boolean, blocked boolean, started_by_me boolean)
language sql stable security definer set search_path = public as $$
  select c.id,
         case when c.user_a = auth.uid() then c.user_b else c.user_a end,
         c.trip_id, c.created_at, c.last_message_at,
         c.last_message_at is not null
           and exists (select 1 from public.messages m
                       where m.conversation_id = c.id and m.sender_id <> auth.uid()
                         and m.created_at > coalesce(case when c.user_a = auth.uid() then c.a_read_at else c.b_read_at end, '-infinity')),
         exists (select 1 from public.message_blocks k where k.blocker_id = auth.uid()
                   and k.blocked_id = case when c.user_a = auth.uid() then c.user_b else c.user_a end),
         public.is_message_blocked(c.user_a, c.user_b),
         c.started_by = auth.uid()
  from public.conversations c
  where auth.uid() in (c.user_a, c.user_b)
  order by coalesce(c.last_message_at, c.created_at) desc
  limit 200;
$$;
grant execute on function public.my_conversations() to authenticated;

create or replace function public.unread_conversation_count()
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from public.my_conversations() where unread and not blocked;
$$;
grant execute on function public.unread_conversation_count() to authenticated;

create or replace function public.mark_conversation_read(c uuid)
returns void language sql security definer set search_path = public as $$
  update public.conversations
     set a_read_at = case when user_a = auth.uid() then now() else a_read_at end,
         b_read_at = case when user_b = auth.uid() then now() else b_read_at end
   where id = c and auth.uid() in (user_a, user_b);
  update public.notifications set read_at = now()
   where user_id = auth.uid() and conversation_id = c and read_at is null;
$$;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

-- The other person's current public key (only for people you share a conversation with)
create or replace function public.current_message_key(other uuid)
returns table (key_id uuid, public_jwk jsonb)
language sql stable security definer set search_path = public as $$
  select k.key_id, pk.public_jwk
  from public.message_keys k join public.message_public_keys pk on pk.key_id = k.key_id
  where k.user_id = other
    and exists (select 1 from public.conversations c
                where c.user_a = least(auth.uid(), other) and c.user_b = greatest(auth.uid(), other));
$$;
grant execute on function public.current_message_key(uuid) to authenticated;

-- Profiles: the person you're messaging can see your public profile even if you haven't posted.
create or replace function public.member_profiles(ids uuid[])
returns table (id uuid, display_name text, avatar_url text, nationality text, gender text, age integer,
               complete boolean, created_at timestamptz, bio text)
language sql stable security definer set search_path = public as $$
  select p.id, p.display_name, p.avatar_url, p.nationality, p.gender,
         case when p.birth_year is null then null
              else extract(year from current_date)::int - p.birth_year end,
         (p.display_name is not null and p.birth_year is not null and p.nationality is not null),
         p.created_at, p.bio
  from public.profiles p
  where p.id = any (ids[1:50])
    and (
      p.id = auth.uid()
      or public.is_admin()
      or exists (select 1 from public.trips t where t.user_id = p.id)
      or exists (select 1 from public.comments c where c.user_id = p.id)
      or exists (select 1 from public.questions q where q.user_id = p.id and q.status <> 'moved')
      or exists (select 1 from public.answers a where a.user_id = p.id)
      or exists (select 1 from public.conversations v
                 where v.user_a = least(auth.uid(), p.id) and v.user_b = greatest(auth.uid(), p.id))
    );
$$;

-- ── Triggers ─────────────────────────────────────────────────
-- Flood guard: at most 30 messages a minute and 500 a day per sender.
create or replace function public.limit_messages()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.messages where sender_id = new.sender_id and created_at > now() - interval '1 minute') >= 30 then
    raise exception 'You’re sending messages very fast. Please wait a minute.';
  end if;
  if (select count(*) from public.messages where sender_id = new.sender_id and created_at > now() - interval '1 day') >= 500 then
    raise exception 'You’ve reached today’s message limit.';
  end if;
  return new;
end;
$$;
drop trigger if exists messages_limit on public.messages;
create trigger messages_limit before insert on public.messages for each row execute function public.limit_messages();

create or replace function public.call_message_alert(payload jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare s text;
begin
  select decrypted_secret into s from vault.decrypted_secrets where name = 'reply_alert_secret' limit 1;
  perform net.http_post(
    url     := 'https://waorryrsgdfvhujreuvq.supabase.co/functions/v1/message-alert',
    body    := payload,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-alert-secret', coalesce(s, ''))
  );
exception when others then null;
end;
$$;
revoke execute on function public.call_message_alert(jsonb) from public, anon, authenticated;

-- Email throttle log (only the Edge Function / triggers use it)
create table if not exists public.message_emails (
  conversation_id uuid not null references public.conversations on delete cascade,
  user_id         uuid not null references auth.users on delete cascade,
  sent_at         timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
alter table public.message_emails enable row level security;

create or replace function public.after_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  c public.conversations;
  recipient uuid;
  their_read timestamptz;
begin
  select * into c from public.conversations where id = new.conversation_id;
  recipient := case when c.user_a = new.sender_id then c.user_b else c.user_a end;
  their_read := case when c.user_a = recipient then c.a_read_at else c.b_read_at end;

  update public.conversations
     set last_message_at = new.created_at,
         a_read_at = case when user_a = new.sender_id then new.created_at else a_read_at end,
         b_read_at = case when user_b = new.sender_id then new.created_at else b_read_at end
   where id = c.id;

  -- Email: reply emails on, not read this chat in the last 5 minutes, no email for this chat in 3 hours
  if exists (select 1 from public.profiles where id = recipient and email_replies)
     and not exists (select 1 from public.bans where user_id = recipient)
     and (their_read is null or their_read < now() - interval '5 minutes')
     and not exists (select 1 from public.message_emails
                     where conversation_id = c.id and user_id = recipient and sent_at > now() - interval '3 hours') then
    insert into public.message_emails (conversation_id, user_id, sent_at) values (c.id, recipient, now())
      on conflict (conversation_id, user_id) do update set sent_at = now();
    perform public.call_message_alert(jsonb_build_object('type', 'message', 'conversation_id', c.id,
                                                         'recipient', recipient, 'sender', new.sender_id));
  end if;
  return new;
end;
$$;
drop trigger if exists messages_after on public.messages;
create trigger messages_after after insert on public.messages for each row execute function public.after_message();

-- New conversation with someone who hasn't set up messaging yet: 🔔 + email inviting them.
create or replace function public.after_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
declare recipient uuid := case when new.user_a = new.started_by then new.user_b else new.user_a end;
begin
  if not exists (select 1 from public.message_keys where user_id = recipient) then
    insert into public.notifications (user_id, kind, actor_id, conversation_id, trip_id)
    values (recipient, 'message_invite', new.started_by, new.id, new.trip_id);
    if exists (select 1 from public.profiles where id = recipient and email_replies) then
      perform public.call_message_alert(jsonb_build_object('type', 'invite', 'conversation_id', new.id,
                                                           'recipient', recipient, 'sender', new.started_by));
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists conversations_after on public.conversations;
create trigger conversations_after after insert on public.conversations for each row execute function public.after_conversation();

-- Once someone sets up messaging, people waiting to message them get a 🔔.
create or replace function public.after_message_key()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.notifications set read_at = now()
     where user_id = new.user_id and kind = 'message_invite' and read_at is null;
  end if;
  return new;
end;
$$;
drop trigger if exists message_keys_after on public.message_keys;
create trigger message_keys_after after insert on public.message_keys for each row execute function public.after_message_key();

-- ── Reports on conversations ─────────────────────────────────
alter table public.reports add column if not exists evidence jsonb check (evidence is null or octet_length(evidence::text) < 20000);
alter table public.reports add column if not exists reported_user uuid references auth.users on delete set null;
alter table public.reports drop constraint if exists reports_kind_check;
alter table public.reports add constraint reports_kind_check
  check (kind in ('post', 'reply', 'profile', 'question', 'answer', 'conversation'));

-- A conversation report must come from someone in that conversation, about the other person.
create or replace function public.check_conversation_report()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.kind = 'conversation' then
    if not exists (select 1 from public.conversations c
                   where c.id = new.target_id and new.reporter_id in (c.user_a, c.user_b)
                     and new.reported_user in (c.user_a, c.user_b) and new.reported_user <> new.reporter_id) then
      raise exception 'You can only report conversations you are part of.';
    end if;
  elsif new.evidence is not null or new.reported_user is not null then
    new.evidence := null; new.reported_user := null;
  end if;
  return new;
end;
$$;
drop trigger if exists reports_conversation_check on public.reports;
create trigger reports_conversation_check before insert on public.reports for each row execute function public.check_conversation_report();

-- ── Live updates ─────────────────────────────────────────────
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'messages') then
      alter publication supabase_realtime add table public.messages;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'conversations') then
      alter publication supabase_realtime add table public.conversations;
    end if;
  end if;
end $$;

-- ── Tighten who can call what ────────────────────────────────
-- Site functions: signed-in members only. Trigger functions: nobody calls them directly.
revoke execute on function public.in_conversation(uuid), public.set_message_key(jsonb, text, text, text, int),
  public.start_conversation(uuid, uuid), public.my_conversations(), public.unread_conversation_count(),
  public.mark_conversation_read(uuid), public.current_message_key(uuid) from public, anon;
grant execute on function public.in_conversation(uuid), public.set_message_key(jsonb, text, text, text, int),
  public.start_conversation(uuid, uuid), public.my_conversations(), public.unread_conversation_count(),
  public.mark_conversation_read(uuid), public.current_message_key(uuid) to authenticated;
revoke execute on function public.limit_messages(), public.after_message(), public.after_conversation(),
  public.after_message_key(), public.check_conversation_report() from public, anon, authenticated;

-- Table access for signed-in members (the row-level rules above still decide which rows)
grant select on public.conversations, public.message_keys, public.message_public_keys to authenticated;
grant select, insert on public.messages to authenticated;
grant select, insert, delete on public.message_blocks to authenticated;
revoke all on public.conversations, public.message_keys, public.message_public_keys, public.messages,
  public.message_blocks, public.message_emails from anon;

-- The send rule uses one helper that only answers for the caller's own conversation,
-- so nobody can probe whether two other people have blocked each other.
create or replace function public.can_send_in(c uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.conversations v
                 where v.id = c and auth.uid() in (v.user_a, v.user_b)
                   and not public.is_message_blocked(v.user_a, v.user_b));
$$;
revoke execute on function public.can_send_in(uuid) from public, anon;
grant execute on function public.can_send_in(uuid) to authenticated;
drop policy if exists "Members send messages" on public.messages;
create policy "Members send messages"
  on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and public.has_profile()
    and public.can_send_in(conversation_id)
    and sender_key_id = (select key_id from public.message_keys where user_id = auth.uid())
  );
revoke execute on function public.is_message_blocked(uuid, uuid) from public, anon, authenticated;

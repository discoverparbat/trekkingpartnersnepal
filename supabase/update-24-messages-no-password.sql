-- Update 24: private messages without a messages password
-- ─────────────────────────────────────────────────────────────
-- • Messages are now stored as text tied to the members' Google accounts. Row-level security still means
--   only the two people in a conversation can read them. No messages password, nothing lost on a new device.
-- • Messages are on for every member with a complete profile – no setup step.
-- • Messages sent before this update were end-to-end encrypted. They stay in the database untouched until
--   one of the two people in that chat opens Messages on a device that still has their old key, or enters
--   their old messages password once. Their browser then decrypts those messages and saves the text back
--   (restore_messages below), for both people. The encrypted copy is cleared once the text is saved.
-- Needs updates 22 and 23. Safe to run more than once.

-- ── Messages: plain text column ──────────────────────────────
alter table public.messages add column if not exists body text;
alter table public.messages drop constraint if exists messages_body_len;
alter table public.messages add constraint messages_body_len check (body is null or char_length(body) between 1 and 4000);
alter table public.messages alter column ciphertext drop not null;
alter table public.messages alter column iv drop not null;
alter table public.messages alter column sender_key_id drop not null;
alter table public.messages alter column recipient_key_id drop not null;
alter table public.messages drop constraint if exists messages_has_content;
alter table public.messages add constraint messages_has_content check (body is not null or ciphertext is not null);

-- New messages: text only.
drop policy if exists "Members send messages" on public.messages;
create policy "Members send messages"
  on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and public.has_profile()
    and public.can_send_in(conversation_id)
    and body is not null
    and ciphertext is null and iv is null and sender_key_id is null and recipient_key_id is null
  );

-- ── Bringing back old encrypted messages ─────────────────────
-- How many messages in my chats are still waiting to be restored.
create or replace function public.locked_message_count()
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from public.messages m
  where m.body is null and public.in_conversation(m.conversation_id);
$$;
revoke execute on function public.locked_message_count() from public, anon;
grant execute on function public.locked_message_count() to authenticated;

-- Save the text of old messages that my browser just decrypted: [{"id": …, "body": …}, …].
-- Only for chats I'm in, only for messages that haven't been restored yet. Returns how many were saved.
create or replace function public.restore_messages(items jsonb)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if auth.uid() is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) > 500 then return 0; end if;
  update public.messages m
     set body = left(x.body, 4000), ciphertext = null, iv = null
    from jsonb_to_recordset(items) as x(id uuid, body text)
   where m.id = x.id
     and m.body is null
     and m.ciphertext is not null
     and coalesce(char_length(x.body), 0) > 0
     and public.in_conversation(m.conversation_id);
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke execute on function public.restore_messages(jsonb) from public, anon;
grant execute on function public.restore_messages(jsonb) to authenticated;

-- Members can't change or erase their old messages password key anymore; it's only read to restore old messages.
revoke execute on function public.set_message_key(jsonb, text, text, text, int) from authenticated;

-- ── No setup step any more ───────────────────────────────────
-- Everyone with a complete profile can receive messages, so no "turn on messages" invite on a new chat.
drop trigger if exists conversations_after on public.conversations;
drop trigger if exists message_keys_after on public.message_keys;

-- Live updates also for restored messages (UPDATE events).
alter table public.messages replica identity default;

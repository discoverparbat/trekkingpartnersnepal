-- Update 23: tell people who were waiting that they can write now.
-- When a member turns on messages, everyone who started a chat with them (and is still waiting,
-- i.e. no messages yet) gets a 🔔 "<name> turned on messages – you can write now".
-- Needs update 22. Safe to run more than once.

alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('welcome', 'first_post', 'reply', 'thread_reply', 'answer', 'thread_answer', 'best_answer',
                  'moved_to_partners', 'announcement', 'new_question', 'message_invite', 'admin_alert', 'message_ready'));

create or replace function public.after_message_key()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    -- their own "X wants to message you" invites are done
    update public.notifications set read_at = now()
     where user_id = new.user_id and kind = 'message_invite' and read_at is null;
    -- people waiting to message them can write now
    insert into public.notifications (user_id, kind, actor_id, conversation_id, trip_id)
    select c.started_by, 'message_ready', new.user_id, c.id, c.trip_id
      from public.conversations c
     where new.user_id in (c.user_a, c.user_b)
       and c.started_by <> new.user_id
       and c.last_message_at is null
       and not public.is_message_blocked(c.user_a, c.user_b);
  end if;
  return new;
end;
$$;
revoke execute on function public.after_message_key() from public, anon, authenticated;

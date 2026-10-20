-- Update 10: Community (questions & answers about treks) + admin trail notes
--   • admin_notes   – the pinned "Trail & weather updates" box (admins only write)
--   • questions     – trek questions from members (public to read)
--   • answers       – answers from members (public to read)
--   • answer_votes  – "Helpful" votes on answers
--   • bell notifications for new answers, best answers and questions moved to Find partners
--   • reports can now point at questions and answers
--
-- Run once in Supabase: SQL Editor → New query → paste → Run.
-- Run it AFTER update-8-notifications.sql. Safe to run again.

-- ── Admin notes (trail, weather, closures, site news) ────────
create table if not exists public.admin_notes (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('trail', 'weather', 'closure', 'site')),
  headline    text check (char_length(headline) <= 80),          -- optional bold start, e.g. "Thorong La"
  body        text not null check (char_length(body) between 5 and 500),
  expires_at  timestamptz,                                      -- null = stays until deleted
  created_by  uuid default auth.uid() references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists admin_notes_latest_idx on public.admin_notes (created_at desc);

alter table public.admin_notes enable row level security;

drop policy if exists "Current notes are public" on public.admin_notes;
drop policy if exists "Admins add notes" on public.admin_notes;
drop policy if exists "Admins edit notes" on public.admin_notes;
drop policy if exists "Admins delete notes" on public.admin_notes;

create policy "Current notes are public"
  on public.admin_notes for select
  using (expires_at is null or expires_at > now() or public.is_admin());
create policy "Admins add notes"
  on public.admin_notes for insert to authenticated with check (public.is_admin());
create policy "Admins edit notes"
  on public.admin_notes for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete notes"
  on public.admin_notes for delete to authenticated using (public.is_admin());

revoke all on public.admin_notes from anon, authenticated;
grant select on public.admin_notes to anon, authenticated;
grant insert (kind, headline, body, expires_at), update (kind, headline, body, expires_at), delete
  on public.admin_notes to authenticated;

-- ── Questions ────────────────────────────────────────────────
create table if not exists public.questions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  trek              text not null check (char_length(trek) between 2 and 80),   -- trek slug, or 'general'
  region            text check (char_length(region) <= 80),                     -- region slug (null for 'general')
  topic             text not null check (topic in ('conditions', 'gear', 'permits', 'teahouses', 'transport', 'other')),
  title             text not null check (char_length(title) between 10 and 140),
  body              text not null check (char_length(body) between 20 and 3000),
  status            text not null default 'open' check (status in ('open', 'closed', 'moved')),
  pinned            boolean not null default false,
  best_answer_id    uuid,                                -- the answer the asker (or an admin) picked
  answers_count     int not null default 0,
  last_activity_at  timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index if not exists questions_list_idx on public.questions (status, pinned desc, last_activity_at desc);
create index if not exists questions_trek_idx on public.questions (trek, last_activity_at desc);
create index if not exists questions_user_idx on public.questions (user_id);

-- ── Answers ──────────────────────────────────────────────────
create table if not exists public.answers (
  id           uuid primary key default gen_random_uuid(),
  question_id  uuid not null references public.questions(id) on delete cascade,
  user_id      uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  body         text not null check (char_length(body) between 2 and 2000),
  edited_at    timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists answers_question_idx on public.answers (question_id, created_at);
create index if not exists answers_user_idx on public.answers (user_id);

-- ── Helpful votes ────────────────────────────────────────────
create table if not exists public.answer_votes (
  answer_id   uuid not null references public.answers(id) on delete cascade,
  user_id     uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (answer_id, user_id)
);

-- ── Who can do what ──────────────────────────────────────────
alter table public.questions    enable row level security;
alter table public.answers      enable row level security;
alter table public.answer_votes enable row level security;

drop policy if exists "Questions are public" on public.questions;
drop policy if exists "Members ask questions" on public.questions;
drop policy if exists "Owner or admin updates question" on public.questions;
drop policy if exists "Owner or admin deletes question" on public.questions;

-- Questions moved to Find partners are hidden from everyone except the asker and admins.
create policy "Questions are public"
  on public.questions for select
  using (status <> 'moved' or auth.uid() = user_id or public.is_admin());
create policy "Members ask questions"
  on public.questions for insert to authenticated
  with check (auth.uid() = user_id and public.has_profile());
create policy "Owner or admin updates question"
  on public.questions for update to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());
create policy "Owner or admin deletes question"
  on public.questions for delete to authenticated
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Answers are public" on public.answers;
drop policy if exists "Members answer open questions" on public.answers;
drop policy if exists "Members edit their own answers" on public.answers;
drop policy if exists "Owner or admin deletes answer" on public.answers;

-- An answer is visible when its question is (the questions rule above applies inside this check).
create policy "Answers are public"
  on public.answers for select
  using (exists (select 1 from public.questions q where q.id = answers.question_id));
create policy "Members answer open questions"
  on public.answers for insert to authenticated
  with check (
    auth.uid() = user_id and public.has_profile() and (
      exists (select 1 from public.questions q where q.id = answers.question_id and q.status = 'open')
      or (public.is_admin() and exists (select 1 from public.questions q where q.id = answers.question_id))
    )
  );
create policy "Members edit their own answers"
  on public.answers for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Owner or admin deletes answer"
  on public.answers for delete to authenticated
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users see their own votes" on public.answer_votes;
drop policy if exists "Members vote on others' answers" on public.answer_votes;
drop policy if exists "Users remove their own votes" on public.answer_votes;

create policy "Users see their own votes"
  on public.answer_votes for select to authenticated using (auth.uid() = user_id);
create policy "Members vote on others' answers"
  on public.answer_votes for insert to authenticated
  with check (
    auth.uid() = user_id and public.has_profile()
    and not exists (select 1 from public.answers a where a.id = answer_votes.answer_id and a.user_id = auth.uid())
  );
create policy "Users remove their own votes"
  on public.answer_votes for delete to authenticated using (auth.uid() = user_id);

-- Vote counts are public
create or replace view public.answer_vote_counts as
select answer_id, count(*)::int as helpful from public.answer_votes group by answer_id;

-- ── Permissions for the website (the rules above still apply) ──
revoke all on public.questions from anon, authenticated;
grant select on public.questions to anon, authenticated;
grant insert (trek, region, topic, title, body) on public.questions to authenticated;
grant update (trek, region, topic, title, body, best_answer_id, status, pinned) on public.questions to authenticated;
grant delete on public.questions to authenticated;

revoke all on public.answers from anon, authenticated;
grant select on public.answers to anon, authenticated;
grant insert (question_id, body) on public.answers to authenticated;
grant update (body) on public.answers to authenticated;
grant delete on public.answers to authenticated;

revoke all on public.answer_votes from anon, authenticated;
grant select, delete on public.answer_votes to authenticated;
grant insert (answer_id) on public.answer_votes to authenticated;
grant select on public.answer_vote_counts to anon, authenticated;

-- ── Checks on new questions ──────────────────────────────────
-- Members can't set status, pin or counters themselves. Max 5 questions a day.
create or replace function public.prepare_question()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.title := btrim(new.title);
  new.body := btrim(new.body);
  new.answers_count := 0;
  new.best_answer_id := null;
  new.last_activity_at := now();
  new.created_at := now();
  if public.is_admin() then return new; end if;
  new.status := 'open';
  new.pinned := false;
  if (select count(*) from public.questions
      where user_id = new.user_id and created_at > now() - interval '1 day') >= 5 then
    raise exception 'You can ask up to 5 questions a day. Please add to one of your existing questions instead.';
  end if;
  if exists (select 1 from public.questions
             where user_id = new.user_id and lower(title) = lower(new.title) and created_at > now() - interval '7 days') then
    raise exception 'You already asked this question.';
  end if;
  return new;
end;
$$;

drop trigger if exists questions_prepare on public.questions;
create trigger questions_prepare before insert on public.questions
  for each row execute function public.prepare_question();

-- Edits: only admins pin, close or move. Counters are kept by the database.
create or replace function public.guard_question()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('tpn.system', true), '') = '1' then return new; end if;
  new.user_id := old.user_id;
  new.created_at := old.created_at;
  new.answers_count := old.answers_count;
  new.last_activity_at := old.last_activity_at;
  if not public.is_admin() then
    new.status := old.status;
    new.pinned := old.pinned;
  end if;
  if new.best_answer_id is distinct from old.best_answer_id and new.best_answer_id is not null
     and not exists (select 1 from public.answers where id = new.best_answer_id and question_id = new.id) then
    raise exception 'That answer does not belong to this question.';
  end if;
  return new;
end;
$$;

drop trigger if exists questions_guard on public.questions;
create trigger questions_guard before update on public.questions
  for each row execute function public.guard_question();

-- ── Checks on new answers ────────────────────────────────────
-- Max 30 answers an hour, and no identical answer twice on one question.
create or replace function public.prepare_answer()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.body := btrim(new.body);
  new.edited_at := null;
  new.created_at := now();
  if public.is_admin() then return new; end if;
  if (select count(*) from public.answers
      where user_id = new.user_id and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'You are answering very fast. Please wait a little and try again.';
  end if;
  if exists (select 1 from public.answers
             where user_id = new.user_id and question_id = new.question_id and body = new.body) then
    raise exception 'You already posted this answer.';
  end if;
  return new;
end;
$$;

drop trigger if exists answers_prepare on public.answers;
create trigger answers_prepare before insert on public.answers
  for each row execute function public.prepare_answer();

create or replace function public.guard_answer()
returns trigger language plpgsql as $$
begin
  new.user_id := old.user_id;
  new.question_id := old.question_id;
  new.created_at := old.created_at;
  new.body := btrim(new.body);
  if new.body is distinct from old.body then new.edited_at := now(); end if;
  return new;
end;
$$;

drop trigger if exists answers_guard on public.answers;
create trigger answers_guard before update on public.answers
  for each row execute function public.guard_answer();

-- ── Answer counts and "last active" time on each question ────
create or replace function public.count_answers()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform set_config('tpn.system', '1', true);
  if tg_op = 'INSERT' then
    update public.questions
       set answers_count = answers_count + 1, last_activity_at = now()
     where id = new.question_id;
  else
    update public.questions
       set answers_count = greatest(answers_count - 1, 0),
           best_answer_id = case when best_answer_id = old.id then null else best_answer_id end
     where id = old.question_id;
  end if;
  perform set_config('tpn.system', '', true);
  return null;
end;
$$;

drop trigger if exists answers_count on public.answers;
create trigger answers_count after insert or delete on public.answers
  for each row execute function public.count_answers();

-- ── Notifications (the bell) ─────────────────────────────────
alter table public.notifications add column if not exists question_id uuid references public.questions(id) on delete cascade;
alter table public.notifications add column if not exists answer_id uuid references public.answers(id) on delete cascade;

alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('welcome', 'first_post', 'reply', 'thread_reply',
                  'answer', 'thread_answer', 'best_answer', 'moved_to_partners'));

create index if not exists notifications_unread_q_idx
  on public.notifications (user_id, question_id, kind) where read_at is null;

-- New answer: tells the asker ('answer') and earlier answerers ('thread_answer'), never the person answering.
-- While a notification is unread, new answers on the same question are added to it ("3 new answers").
create or replace function public.notify_answer()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  owner uuid;
  r uuid;
  k text;
begin
  select user_id into owner from public.questions where id = new.question_id;
  if owner is null then return new; end if;

  for r in
    select x.uid from (
      select owner as uid
      union
      select a.user_id from public.answers a where a.question_id = new.question_id
    ) x
    where x.uid <> new.user_id
      and not exists (select 1 from public.bans b where b.user_id = x.uid)
  loop
    k := case when r = owner then 'answer' else 'thread_answer' end;
    update public.notifications
       set count = count + 1, actor_id = new.user_id, answer_id = new.id, created_at = now()
     where user_id = r and question_id = new.question_id and kind = k and read_at is null;
    if not found then
      insert into public.notifications (user_id, kind, question_id, answer_id, actor_id)
      values (r, k, new.question_id, new.id, new.user_id);
    end if;
  end loop;
  return new;
exception when others then
  return new;   -- a notification problem must never stop an answer being posted
end;
$$;

drop trigger if exists answers_notify on public.answers;
create trigger answers_notify after insert on public.answers
  for each row execute function public.notify_answer();

-- Best answer chosen → tell the person who wrote it.
-- Question moved out of Community → tell the asker to post on Find partners instead.
create or replace function public.notify_question_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  author uuid;
begin
  if new.best_answer_id is not null and new.best_answer_id is distinct from old.best_answer_id then
    select user_id into author from public.answers where id = new.best_answer_id;
    if author is not null and author <> new.user_id then
      insert into public.notifications (user_id, kind, question_id, answer_id, actor_id)
      values (author, 'best_answer', new.id, new.best_answer_id, new.user_id);
    end if;
  end if;
  if new.status = 'moved' and old.status <> 'moved' then
    insert into public.notifications (user_id, kind, question_id)
    values (new.user_id, 'moved_to_partners', new.id);
  end if;
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists questions_notify on public.questions;
create trigger questions_notify after update of best_answer_id, status on public.questions
  for each row execute function public.notify_question_change();

-- ── Show the team badge to visitors who aren't signed in ─────
-- Answers from the admin account show "Trekking Partners Nepal · Admin" instead of the
-- personal profile. Visitors need to read the admin list for that (it only holds ids).
do $$
begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'admin_ids' and p.pronargs = 0) then
    grant execute on function public.admin_ids() to anon, authenticated;
  end if;
end $$;

-- ── Reports can point at questions and answers ───────────────
alter table public.reports drop constraint if exists reports_kind_check;
alter table public.reports add constraint reports_kind_check
  check (kind in ('post', 'reply', 'profile', 'question', 'answer'));

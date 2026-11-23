-- Update 29: Community guides
-- Members can now post a "Guide" (their experience of a trek) as well as a "Question".
-- Guides live in the same questions table, with:
--   • kind     – 'question' (default, every existing post) or 'guide'
--   • trekked  – when the guide's author did the trek, 'YYYY-MM' (guides only)
--   • guides can be up to 10,000 characters (questions stay at 3,000)
--   • question_votes – "Helpful" votes on guides (answers keep their own votes)
-- Replies on a guide are stored as answers but shown as comments; guides have no best answer.
--
-- Run once in Supabase: SQL Editor → New query → paste → Run (after update-28-push.sql).
-- Safe to run again. Until it has run, the site keeps working with questions only.

-- ── New columns ──────────────────────────────────────────────
alter table public.questions add column if not exists kind text not null default 'question';
alter table public.questions add column if not exists trekked text;

alter table public.questions drop constraint if exists questions_kind_check;
alter table public.questions add constraint questions_kind_check check (kind in ('question', 'guide'));

alter table public.questions drop constraint if exists questions_trekked_check;
alter table public.questions add constraint questions_trekked_check
  check (trekked is null or (kind = 'guide' and trekked ~ '^20[0-9]{2}-(0[1-9]|1[0-2])$'));

-- Body length: 3,000 for questions, 10,000 for guides
alter table public.questions drop constraint if exists questions_body_check;
alter table public.questions add constraint questions_body_check
  check (char_length(body) between 20 and case when kind = 'guide' then 10000 else 3000 end);

create index if not exists questions_kind_idx on public.questions (kind, last_activity_at desc);

-- The website may set kind and trekked
grant insert (trek, region, topic, title, body, kind, trekked) on public.questions to authenticated;
grant update (trek, region, topic, title, body, best_answer_id, status, pinned, kind, trekked) on public.questions to authenticated;

-- ── Guides never get a best answer ───────────────────────────
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
  if new.kind = 'guide' then
    new.best_answer_id := null;
  else
    new.trekked := null;
  end if;
  if new.best_answer_id is distinct from old.best_answer_id and new.best_answer_id is not null
     and not exists (select 1 from public.answers where id = new.best_answer_id and question_id = new.id) then
    raise exception 'That answer does not belong to this question.';
  end if;
  return new;
end;
$$;

-- New posts: same checks as before (max 5 a day, no duplicates), plus guide rules
create or replace function public.prepare_question()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.title := btrim(new.title);
  new.body := btrim(new.body);
  new.answers_count := 0;
  new.best_answer_id := null;
  new.last_activity_at := now();
  new.created_at := now();
  if coalesce(new.kind, 'question') <> 'guide' then new.trekked := null; end if;
  if public.is_admin() then return new; end if;
  new.status := 'open';
  new.pinned := false;
  if (select count(*) from public.questions
      where user_id = new.user_id and created_at > now() - interval '1 day') >= 5 then
    raise exception 'You can post up to 5 questions or guides a day. Please add to one of your existing posts instead.';
  end if;
  if exists (select 1 from public.questions
             where user_id = new.user_id and lower(title) = lower(new.title) and created_at > now() - interval '7 days') then
    raise exception 'You already posted this.';
  end if;
  return new;
end;
$$;

-- ── "Helpful" votes on guides ────────────────────────────────
create table if not exists public.question_votes (
  question_id uuid not null references public.questions(id) on delete cascade,
  user_id     uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (question_id, user_id)
);

alter table public.question_votes enable row level security;

drop policy if exists "Users see their own guide votes" on public.question_votes;
drop policy if exists "Members vote on others' guides" on public.question_votes;
drop policy if exists "Users remove their own guide votes" on public.question_votes;

create policy "Users see their own guide votes"
  on public.question_votes for select to authenticated using (auth.uid() = user_id);
create policy "Members vote on others' guides"
  on public.question_votes for insert to authenticated
  with check (
    auth.uid() = user_id and public.has_profile()
    and exists (select 1 from public.questions q
                where q.id = question_votes.question_id and q.kind = 'guide' and q.user_id <> auth.uid())
  );
create policy "Users remove their own guide votes"
  on public.question_votes for delete to authenticated using (auth.uid() = user_id);

-- Vote counts are public
create or replace view public.question_vote_counts as
select question_id, count(*)::int as helpful from public.question_votes group by question_id;

revoke all on public.question_votes from anon, authenticated;
grant select, delete on public.question_votes to authenticated;
grant insert (question_id) on public.question_votes to authenticated;
grant select on public.question_vote_counts to anon, authenticated;

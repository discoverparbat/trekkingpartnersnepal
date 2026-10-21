-- Update 17: news and greeting emails to all members (first one: Happy Vijaya Dashami 2083)
--   • profiles.email_news – members can turn these emails off (link in every email)
--   • public.news_emails – who got which campaign, so nobody gets the same email twice
--   • public.send_news_email(campaign) – asks the "news-email" Edge Function to send a campaign
--
-- Run once in Supabase: SQL Editor → New query → paste → Run.
-- Run it AFTER the "news-email" Edge Function is deployed (JWT verification off, same RESEND_API_KEY secret).
-- Safe to run again: members who already got the Dashain email are skipped.

alter table public.profiles add column if not exists email_news boolean not null default true;
grant update (email_news) on public.profiles to authenticated;

create table if not exists public.news_emails (
  campaign  text not null,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  sent_at   timestamptz not null default now(),
  primary key (campaign, user_id)
);
alter table public.news_emails enable row level security;   -- no policies: only the Edge Function (service role) uses it

-- One-click unsubscribe from the link in news emails (no sign-in needed)
create or replace function public.unsubscribe_news(token uuid)
returns boolean language sql security definer set search_path = public as $$
  with u as (update public.profiles set email_news = false where unsub_token = token returning 1)
  select exists (select 1 from u);
$$;
grant execute on function public.unsubscribe_news(uuid) to anon, authenticated;

-- Send a campaign (defined in supabase/functions/news-email/index.ts). Admins or the SQL Editor only.
create or replace function public.send_news_email(p_campaign text)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  s text;
begin
  if auth.uid() is not null and not public.is_admin() then
    raise exception 'Admins only';
  end if;
  select decrypted_secret into s from vault.decrypted_secrets where name = 'reply_alert_secret' limit 1;
  return net.http_post(
    url     := 'https://waorryrsgdfvhujreuvq.supabase.co/functions/v1/news-email',
    body    := jsonb_build_object('campaign', p_campaign),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-alert-secret', coalesce(s, '')),
    timeout_milliseconds := 120000
  );
end;
$$;
revoke all on function public.send_news_email(text) from public, anon;
grant execute on function public.send_news_email(text) to authenticated;

-- ── Send the Vijaya Dashami greeting ─────────────────────────
select public.send_news_email('dashain-2083');

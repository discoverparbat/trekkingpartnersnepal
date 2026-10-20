-- Community starter questions: 10 common trekker questions with team answers.
-- Posted from the admin account (shows as "Trekking Partners Nepal"); each answer is marked best.
--
-- Run once in Supabase: SQL Editor → New query → paste → Run (after update-10-community.sql).
-- Safe to run again: questions that already exist (same title) are skipped.

-- Posts made from the SQL Editor or the service role skip the 5-questions-a-day limit
-- (that limit is for members; this changes nothing for them).
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
  if auth.uid() is null then return new; end if;      -- SQL Editor / service role
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

do $$
declare
  team uuid;
  r record;
  qid uuid;
  aid uuid;
begin
  select a.user_id into team
  from public.admins a join public.profiles p on p.id = a.user_id
  limit 1;
  if team is null then
    raise exception 'No admin account with a profile found. Sign in on the site once with your admin Google account, then run this again.';
  end if;

  for r in
    select * from (values
(1, 'annapurna-base-camp', 'annapurna-region', 'permits',
 $t$Do I need a guide and permits for Annapurna Base Camp?$t$,
 $t$I'm planning ABC in November. Can I trek on my own, and which permits do I need? Where do I get them?$t$,
 $t$No, a guide isn't mandatory on ABC right now. The 2023 guide rule isn't being enforced on the main trails, so you can trek on your own. A guide is still recommended on high passes and quieter, less-trekked routes, and it's required in restricted areas.

For ABC you need:
- ACAP permit: NPR 3,000 for foreigners (NPR 1,000 for SAARC nationals). Get it in Kathmandu (Tourist Service Center, Bhrikutimandap) or Pokhara (NTNC office, Lakeside). Bought at a checkpoint it costs double.
- TIMS card: not required at the moment.

Trekking with a guide or agency? They'll usually sort the permit for you. Carry your passport and keep your ACAP permit handy, as it's checked at ACAP checkpoints along the trail.$t$),

(2, 'annapurna-base-camp', 'annapurna-region', 'teahouses',
 $t$Do I need to book ABC teahouses in advance?$t$,
 $t$I've heard teahouses near Base Camp fill up in October and November. Do I really need to book, and how?$t$,
 $t$Right now, yes for the upper trail. Teahouses from Himalaya up through Deurali, MBC and ABC are full most nights this season. Trekkers without a booking are being turned away or put in dining halls.

- Book 2–3 days ahead, through your guide or by phoning the teahouse from Chhomrong or Bamboo.
- Below Himalaya you can usually find a room on the day.
- Solo trekkers may be asked to share a room when it's busy.

We post booking updates in the Trail & weather box at the top of the Community and on the ABC trek page.$t$),

(3, 'annapurna-base-camp', 'annapurna-region', 'other',
 $t$Will I get altitude sickness at ABC?$t$,
 $t$I've never been above 3,000 m. ABC is 4,130 m. How do I avoid altitude sickness, and what are the warning signs?$t$,
 $t$Most people are fine at ABC if they go up gradually. Some still get mild symptoms above 3,500 m, fit or not.

- Don't rush the top: sleep at Deurali or MBC (3,700 m) before ABC rather than racing up from Bamboo or Dovan in one day.
- Watch for: headache, nausea, dizziness, poor sleep, loss of appetite. Tell your guide or trekking partner early.
- If it gets worse, go down. Even 300–500 m lower usually helps quickly. Never sleep higher with worsening symptoms.
- Drink plenty of water, eat well and skip alcohol on the way up.

Thinking about altitude medicine? Talk to a doctor or travel clinic before you leave home.$t$),

(4, 'mardi-himal', 'annapurna-region', 'conditions',
 $t$Do I need microspikes for Mardi Himal in late November or December?$t$,
 $t$Planning Mardi Himal in early December. Will there be snow between High Camp and View Point? Should I bring or rent microspikes?$t$,
 $t$Usually the trail to High Camp is dry into December, but the section above High Camp to Upper View Point can be icy early in the morning, when most people go up for sunrise.

- November: mostly dry; frost and icy patches at dawn above High Camp.
- December–February: snow is more likely above High Camp; microspikes are worth it.
- Rent them cheaply in Pokhara and carry them just in case. They weigh very little.
- Nights at High Camp are well below freezing in winter. Bring a warm layer for the pre-dawn walk.

We'll post here and in the trail updates when our guides report snow.$t$),

(5, 'poon-hill', 'annapurna-region', 'conditions',
 $t$What time should I leave Ghorepani for Poon Hill sunrise?$t$,
 $t$How early do I need to start from Ghorepani to catch sunrise on Poon Hill in November? Is the climb hard in the dark?$t$,
 $t$Leave Ghorepani around 4:45–5:00 am. The climb from 2,860 m to 3,210 m takes 45 minutes to an hour on stone steps, and sunrise in October–November is roughly 6:00–6:30.

- Bring a headtorch, gloves and a warm jacket. It's cold waiting at the top.
- There's a small entry ticket at the gate, so carry some cash.
- Peak season is crowded. Starting 10–15 minutes earlier gets you a good spot.
- Clouds often roll in by mid-morning, so the early start is worth it.$t$),

(6, 'everest-base-camp', 'everest-region', 'permits',
 $t$Which permits do I need for Everest Base Camp, and is a guide required?$t$,
 $t$What permits do I need for EBC, how much are they, and where do I get them? Do I have to hire a guide?$t$,
 $t$You need two entry permits. Both are bought on the trail, so there's nothing to sort out in Kathmandu.

- Khumbu Pasang Lhamu Rural Municipality entry: NPR 3,000 per person (NPR 2,000 for SAARC and Chinese nationals), paid in Lukla.
- Sagarmatha National Park entry: about NPR 3,000 plus VAT, paid at the Monjo checkpoint.

A guide isn't mandatory or enforced on the EBC trail, so you can trek independently. A guide or porter is still recommended if you add high passes like Cho La, Renjo La or Kongma La, and it's the easiest way to share costs with a trekking partner.$t$),

(7, 'everest-base-camp', 'everest-region', 'transport',
 $t$Do Lukla flights leave from Kathmandu or Ramechhap this season?$t$,
 $t$My ticket says Kathmandu–Lukla, but I keep hearing flights go from Ramechhap in autumn. Which is it, and how do I get there?$t$,
 $t$In peak season most Lukla flights leave from Manthali airport in Ramechhap, not Kathmandu, to ease traffic at Kathmandu airport. More Manthali–Lukla flights were added in early October 2026.

- Ramechhap is roughly a 4–5 hour drive from Kathmandu. Most trekkers leave around 1–2 am in a shared jeep or tourist bus to make the morning flights.
- Confirm your departure airport with your airline or agency a few days before.
- Weather delays at Lukla are common. Leave 1–2 spare days at the end of your trip before your international flight.$t$),

(8, 'manaslu-circuit', 'manaslu-region', 'permits',
 $t$Can I get a Manaslu restricted area permit as a solo trekker?$t$,
 $t$I'm travelling alone. My agency says restricted area permits need at least two people. Is that still the rule?$t$,
 $t$Not any more. In March 2026 the Department of Immigration eased the rule, so a solo trekker can now get a restricted area permit.

- You still apply through a registered trekking agency.
- A licensed guide is still required for the whole restricted section.
- Standard permit fees apply, with no extra charge for going solo.

If your agency still quotes the old two-person rule, ask them to check the March 2026 change. Or find a partner on Find partners to share the guide's cost: trekkingpartnersnepal.com/manaslu-region/manaslu-circuit/$t$),

(9, 'general', null, 'gear',
 $t$Do I need my own sleeping bag in teahouses?$t$,
 $t$Teahouses give blankets, right? Do I still need to bring or rent a sleeping bag, and how warm should it be?$t$,
 $t$Yes, bring one. Teahouses give you a bed and usually a blanket, but rooms aren't heated, and in busy season the blankets run out or aren't very clean.

- Treks under about 3,000 m (Poon Hill, Mardi Himal Low Camp): a bag rated around 0 °C is usually enough.
- Higher treks in autumn (ABC, EBC, Gokyo, Manaslu): go for about −10 °C comfort.
- December–February above 4,000 m: −15 °C or warmer, or add a liner.
- Renting in Thamel or Lakeside, Pokhara is cheap and easy if you don't want to buy one.$t$),

(10, 'general', null, 'teahouses',
 $t$Water, cash and phone charging: what should I plan for on the trail?$t$,
 $t$First time trekking in Nepal. Can I buy bottled water? Are there ATMs? How do I charge my phone?$t$,
 $t$Plan to carry cash, refill water, and pay a little for charging and wifi.

- Water: refill from safe-water stations or boiled water at teahouses, and bring a filter or purification tablets. Plastic bottles are discouraged, and some areas restrict them, so carry a reusable bottle.
- Cash: take enough Nepali rupees from Kathmandu or Pokhara for the whole trek. ATMs on the trail are rare and unreliable, and cards are hardly ever accepted.
- Charging and wifi: most teahouses charge a small fee per device or per hour, and prices rise with altitude. A power bank saves money and stress.
- Phone signal: patchy higher up. A local SIM (Ncell or NTC) works in many villages.$t$)
    ) as v(ord, trek, region, topic, title, body, answer)
    order by ord desc
  loop
    continue when exists (select 1 from public.questions q where q.title = r.title);

    insert into public.questions (user_id, trek, region, topic, title, body)
    values (team, r.trek, r.region, r.topic, r.title, r.body)
    returning id into qid;

    insert into public.answers (question_id, user_id, body)
    values (qid, team, r.answer)
    returning id into aid;

    -- Mark the team answer as best, and space the times out so question 1 shows first
    perform set_config('tpn.system', '1', true);
    update public.questions
       set best_answer_id = aid,
           created_at = now() - make_interval(mins => r.ord * 7),
           last_activity_at = now() - make_interval(mins => r.ord * 7 - 3)
     where id = qid;
    perform set_config('tpn.system', '', true);
  end loop;
end $$;

select title, answers_count, best_answer_id is not null as answered
from public.questions order by last_activity_at desc limit 12;

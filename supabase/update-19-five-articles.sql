-- Update 19: five new News & updates articles (27 Oct 2026)
--   guide rules 2026, restricted-area permits, partner vs guide vs group, partner safety, Nov–Dec trekking.
-- Run once in Supabase: SQL Editor → New query → paste → Run. Safe to run again (existing slugs are left alone).

insert into public.news (slug, title, description, body, category, regions, treks, image, image_alt, author, published, featured, published_on)
values ('do-you-need-a-guide-trekking-nepal-2026', 'Do You Need a Guide to Trek in Nepal? The 2026 Rules Explained', 'Guides aren''t mandatory on Nepal''s main trails in 2026 and TIMS is gone. Here''s where a guide is still required and which permits you can get yourself.',
$md$Short answer: on most of Nepal's trekking trails, no. In 2026 a licensed guide is **not mandatory** on the main trails in the Annapurna, Everest, Langtang and other open regions, and you **don't need a TIMS card**. A guide is only required in the **restricted areas**, such as Upper Mustang, Manaslu and Nar Phu, where your permit must also go through a registered agency.

That's a big change from the 2023 rule that told every foreign trekker to hire a guide, and it's why so many people are now asking what they actually need. Here's the current picture, region by region, in plain language.

## The three rules that matter in 2026

1. **No mandatory guide on open trails.** You can trek independently on routes like Annapurna Base Camp, Poon Hill, Mardi Himal, the Annapurna Circuit, Everest Base Camp, Gokyo and the Langtang Valley.
2. **No TIMS card.** You don't need one for any trek.
3. **Restricted areas still need a guide and an agency.** The difference now is that a single trekker can get a restricted-area permit through an agency. You no longer need a second person just to apply.

> Rules in Nepal can change quickly and sometimes vary at local checkpoints. We update this page when they do. If you hear of a change on the trail, tell us in the [Community](/community/).

## Permits you still need

No guide doesn't mean no paperwork. Most treks pass through a **conservation area** or a **national park**, and each has its own entry permit. The good news: you can get these yourself.

| Area | Permit | Where to get it yourself |
|---|---|---|
| Annapurna region (ABC, Poon Hill, Mardi Himal, Circuit, Khopra) | ACAP (Annapurna Conservation Area) | Nepal Tourism Board office in Kathmandu or Pokhara |
| Everest region | Sagarmatha National Park entry, plus a local municipality fee | Park entry at Monjo; municipality fee at Lukla |
| Langtang, Gosaikunda, Helambu | Langtang National Park entry | Nepal Tourism Board in Kathmandu, or at Dhunche |
| Rara, Shey Phoksundo, Makalu Barun and others | Entry for that national park | Nepal Tourism Board in Kathmandu, or at the park entrance |

Bring your passport and a couple of passport photos. Fees change from time to time, so check the current rate at the counter rather than relying on old blog posts.

**Some treks need no permit at all.** Short community trails outside the protected areas, like the 5-day [Kokhe Danda Trek](https://discoverparbat.com/kokhe-danda-trek) in Parbat, don't cross a conservation area or national park.

## Where a guide is still required: restricted areas

Restricted areas sit near the northern border or in sensitive regions. To trek there you need a **special permit** that only a **registered trekking agency** can apply for, and a **licensed guide** must walk with you.

The main restricted treks on this site:

- [Upper Mustang](/annapurna-region/upper-mustang/)
- [Nar Phu Valley](/annapurna-region/nar-phu-valley/)
- [Manaslu Circuit](/manaslu-region/manaslu-circuit/) and [Tsum Valley](/manaslu-region/tsum-valley/)
- [Kanchenjunga Base Camp](/eastern-nepal/kanchenjunga-base-camp/)
- [Upper Dolpo](/western-nepal/upper-dolpo/)
- [Limi Valley](/western-nepal/limi-valley/)

Most of these also need a conservation area or national park permit on top. We explain how it all works in [Restricted Area Treks in Nepal: Permits, Guides and Trekking Solo](/news/restricted-area-treks-nepal-permits-solo/).

## So should you hire a guide anyway?

The rule is gone, but the reasons people hire guides haven't changed. We'd still recommend one for:

- **High passes** like Thorong La, Larkya La, Cho La and Renjo La, especially early or late in the season when snow can hide the trail.
- **Quieter and newer trails**, where signposts are rare and you might not see another trekker all day. Think Khopra, Mohare, Api Himal, Dhorpatan or the far-west treks.
- **Your first trek at altitude**, if you'd like someone who knows the signs of altitude sickness.
- **Cultural depth.** A local guide turns a walk through villages into a conversation with them.

On busy, well-marked trails like Poon Hill, ABC or the Langtang Valley in season, plenty of fit, sensible trekkers go without one.

## The middle option: trek with a partner

Going independent doesn't have to mean going alone. Many trekkers find a partner to share the trail and the costs. If you do hire a guide, splitting the daily fee between two or three people makes it far cheaper per person.

That's exactly what [Trekking Partners Nepal](/) is for. [Post your route and dates](/find-partners/new/) or [browse trekkers already heading out](/find-partners/). It's free.

If you'd rather have it all arranged, you can join one of our [guided fixed departures](/fixed-departures/) with [Discover Parbat](https://discoverparbat.com), a licensed local trekking company. Solo travellers are welcome.

## FAQ

**Is a guide mandatory in Nepal in 2026?**
No, not on the main trekking trails. A licensed guide is only required in restricted areas.

**Do I need a TIMS card?**
No. TIMS is not required for any trek.

**Can I get my trekking permits without an agency?**
Yes, for conservation areas and national parks. You can get them yourself in Kathmandu or Pokhara, or at the park entrance. Only restricted-area permits must go through a registered agency.

**Can I trek a restricted area alone?**
You can now get a restricted-area permit as a single trekker, through an agency. You still need a licensed guide with you, so you won't be fully alone.

**Is it safe to trek without a guide?**
On busy trails in good weather, generally yes, if you're fit, carry a map app and know the signs of altitude sickness. On high passes, quiet trails and in bad weather, a guide or at least a partner is much safer.$md$,
'permits-rules', '{}'::text[], '{}'::text[], '/images/annapurna.jpg', 'A trekker walking alone on a trail in the Annapurna region', 'Sameer Regmi', true, false, '2026-10-27')
on conflict (slug) do nothing;

insert into public.news (slug, title, description, body, category, regions, treks, image, image_alt, author, published, featured, published_on)
values ('restricted-area-treks-nepal-permits-solo', 'Restricted Area Treks in Nepal: Permits, Guides and Trekking Solo', 'How restricted-area permits work in 2026: agency and guide rules, new solo permits, which treks are restricted and how to share the cost with a partner.',
$md$Nepal's restricted areas are some of the most rewarding treks in the country: the walled city of Lo Manthang in Upper Mustang, the Tibetan-style villages of Nar Phu, the Manaslu Circuit and the remote valleys of Dolpo and Humla. They also come with the strictest rules.

Here's how restricted-area permits work in 2026, what changed for solo trekkers, and how to keep the cost down.

## What makes an area "restricted"?

Restricted areas are regions near Nepal's northern border, or culturally and environmentally sensitive valleys, where the government controls how many foreigners visit and how. Everywhere else, you can trek independently. For more on that, see [Do You Need a Guide to Trek in Nepal?](/news/do-you-need-a-guide-trekking-nepal-2026/)

## The rules in 2026

1. **You need a special restricted-area permit.** It's issued by the Department of Immigration, but you can't apply yourself. A **registered trekking agency** applies on your behalf.
2. **A licensed guide must go with you** for the whole time you're inside the restricted zone.
3. **Solo trekkers can now get a permit.** In the past you needed at least two trekkers on the same permit. Now a single trekker can apply through an agency.
4. **You usually need a second permit too.** Most restricted treks also pass through a conservation area or national park, which has its own entry permit.

> Restricted-area permits are charged per person, often per week or per day, and some areas cost much more than others. Ask your agency for the current fee in writing before you book.

## Restricted treks at a glance

| Trek | Region | Extra permit usually needed | Typical length |
|---|---|---|---|
| [Upper Mustang](/annapurna-region/upper-mustang/) | Annapurna | ACAP | 12–17 days |
| [Nar Phu Valley](/annapurna-region/nar-phu-valley/) | Annapurna | ACAP | 10–14 days |
| [Manaslu Circuit](/manaslu-region/manaslu-circuit/) | Manaslu | Manaslu and Annapurna conservation areas | 14–18 days |
| [Tsum Valley](/manaslu-region/tsum-valley/) | Manaslu | Manaslu Conservation Area | 12–16 days |
| [Kanchenjunga Base Camp](/eastern-nepal/kanchenjunga-base-camp/) | Eastern Nepal | Kanchenjunga Conservation Area | 20–24 days |
| [Upper Dolpo](/western-nepal/upper-dolpo/) | Western Nepal | Shey Phoksundo National Park | 20+ days |
| [Limi Valley](/western-nepal/limi-valley/) | Western Nepal | — | 15–18 days |

Check each trek page for current conditions, season and recent partner posts.

## Solo permits: what changed and what didn't

Being able to apply alone is good news if you couldn't find a partner in time. But two things haven't changed:

- **You still pay for a whole guide.** Alone, the full daily guide cost is yours. With two or three trekkers, it's split.
- **You'll still walk with someone.** The guide stays with you inside the restricted zone, so "solo" really means "without other trekkers".

## How to cut the cost: share the guide

The simplest way to make a restricted trek affordable is to go with others on the same permit and guide. You split:

- the guide's daily fee, food and lodging
- jeeps and transfers (Besisahar, Jomsom, Soti Khola and the like)
- the agency's arrangement fee

**This is what Trekking Partners Nepal is built for.** [Post your restricted trek](/find-partners/new/) with your dates, or [browse posts for Manaslu, Mustang and others](/find-partners/). Once you've found a partner, apply through the same agency so you're on one permit with one guide.

## Choosing an agency

- Make sure it's **registered** with the Department of Tourism and the Trekking Agencies' Association of Nepal (TAAN).
- Ask what's included: permit, guide wages and insurance, transport, food on the trail.
- Ask for the **guide's name and experience** on that specific route.
- Get the **fees in writing**, broken down.
- Book early for October–November and April, when guides for Manaslu and Mustang get busy.

[Discover Parbat](https://discoverparbat.com) is a licensed agency based in Parbat, near Pokhara, and arranges restricted-area permits and guides for solo trekkers and pairs from Trekking Partners Nepal. [Get in touch](https://discoverparbat.com/contact) with your route and dates.

## FAQ

**Can I trek Upper Mustang or Manaslu alone?**
You can get the permit as a single trekker, through a registered agency. A licensed guide must stay with you, so you won't be entirely alone.

**Can I get a restricted-area permit myself?**
No. Only a registered trekking agency can apply. You provide your passport, visa details and photos.

**Do I need TIMS for restricted areas?**
No. TIMS isn't required for any trek in Nepal.

**How far ahead should I arrange it?**
Two to four weeks is comfortable. In peak season, the earlier the better, since the right guide matters more than the paperwork.

**Can two trekkers who met online share one permit?**
Yes. That's the most common way to share the cost. Apply together through the same agency.$md$,
'permits-rules', '{}'::text[], array['upper-mustang','nar-phu-valley','manaslu-circuit','tsum-valley','kanchenjunga-base-camp','upper-dolpo','limi-valley']::text[], '/images/manaslu1.webp', 'Manaslu above a village gate on the Manaslu Circuit, a restricted-area trek', 'Sameer Regmi', true, false, '2026-10-27')
on conflict (slug) do nothing;

insert into public.news (slug, title, description, body, category, regions, treks, image, image_alt, author, published, featured, published_on)
values ('trekking-partner-vs-guide-vs-group-nepal', 'Partner, Guide or Group? How to Choose the Right Way to Trek Nepal', 'Trekking partner, private guide or fixed-departure group? An honest comparison of cost, flexibility and safety to help solo travellers choose.',
$md$If you're planning a trek in Nepal on your own, you've got three realistic ways to do it: find a **trekking partner**, hire a **private guide**, or join a **small-group fixed departure**. None is "best". Each suits a different kind of trekker, budget and trail.

Here's an honest comparison to help you choose.

## The quick comparison

| | Trekking partner | Private guide | Fixed-departure group |
|---|---|---|---|
| **Cost** | Lowest | Highest if alone, much less shared | Middle, all-in price |
| **Flexibility** | You and your partner decide | Fully flexible | Set dates and route |
| **Planning work** | You do it all | Guide or agency helps | Done for you |
| **Company** | One or two people | Your guide | A small group |
| **Restricted areas** | Only with a guide added | Yes | Yes, if it's that route |
| **Best for** | Independent, experienced trekkers | Specific routes, more comfort | First-timers, short trips, solo travellers |

## Option 1: Find a trekking partner

You team up with one or two other trekkers going the same way at the same time, and share the walking, the planning and the costs.

**Why it works**

- Since 2026 you don't need a guide on Nepal's main trails, so two independent trekkers can go wherever the trail is open. See [Do You Need a Guide to Trek in Nepal?](/news/do-you-need-a-guide-trekking-nepal-2026/)
- Rooms, jeeps and even a guide cost far less split two or three ways.
- Someone has your back on a long climb or if altitude hits.

**The catch**

- You need to find the right person, with similar pace, budget and dates.
- You're responsible for routes, permits and decisions.

**How to do it:** [post your route and dates](/find-partners/new/) on Trekking Partners Nepal or [browse who's already going](/find-partners/). Before you commit, read [How to Vet a Trekking Partner Before You Hit the Trail](/news/trekking-partner-safety-nepal/).

## Option 2: Hire a private guide

A licensed guide walks with you, handles the route, lodging and logistics, and knows when to turn around.

**Why it works**

- Required for restricted areas like Upper Mustang, Manaslu and Nar Phu.
- Worth it on high passes, quiet new trails and your first trek at altitude.
- Total flexibility on dates, pace and side trips.
- A good local guide opens doors to villages, food and stories you'd walk straight past.

**The catch**

- On your own, you pay the full daily fee. That's where a partner helps: share the guide, halve the cost.

## Option 3: Join a fixed-departure group

You book a seat on a trek that's already scheduled, with a guide, a route and other trekkers sorted.

**Why it works**

- Zero planning. Turn up in Pokhara or Kathmandu and go.
- Company is guaranteed, which is ideal if you're travelling solo and short on time.
- One clear price that covers the guide, lodging and usually meals and transport.

**The catch**

- Set dates and a set route.
- You don't choose your fellow trekkers.

Our [fixed departures](/fixed-departures/) run with [Discover Parbat](https://discoverparbat.com), a licensed local company in Parbat near Pokhara. A good first pick is the short [Kokhe Danda Trek](https://discoverparbat.com/kokhe-danda-trek): five easy days with homestays in Haljure, Magar village life in Lespar and close-up views of Dhaulagiri and the Annapurnas. The 5-day route needs no permits.

## Which one is right for you?

**Choose a partner if** you've trekked before, like making your own decisions, are on a budget, and are heading for an open trail like ABC, Mardi Himal, Langtang or Everest Base Camp.

**Choose a guide if** you're going to a restricted area, crossing a high pass, trying a remote route or want more comfort. Ideally, find a partner too and share them.

**Choose a fixed departure if** it's your first time in Nepal, you're short on time, or you just want to show up and walk.

Plenty of trekkers mix them: a fixed departure for a first short trek, then a longer trek with a partner they met along the way.

## FAQ

**Is it cheaper to trek with a partner or join a group?**
Two independent partners on an open trail usually spend the least. Once you add a guide, a group departure and a partner-plus-guide trip often cost about the same.

**Can I find a partner and then hire a guide together?**
Yes. It's one of the best-value ways to trek in Nepal, and required if you're heading to a restricted area.

**Are fixed departures OK for solo travellers?**
Yes. Most people who join are travelling alone.$md$,
'trek-news', '{}'::text[], array['kokhe-danda']::text[], '/images/manaslu.jpg', 'Two trekkers walking together towards a snow peak', 'Sameer Regmi', true, false, '2026-10-27')
on conflict (slug) do nothing;

insert into public.news (slug, title, description, body, category, regions, treks, image, image_alt, author, published, featured, published_on)
values ('trekking-partner-safety-nepal', 'How to Vet a Trekking Partner Before You Hit the Trail', 'Meeting a trekking partner online? How to check them out, what to agree before you start and how to stay safe on the trail in Nepal.',
$md$Trekking with someone you met online is one of the best ways to see Nepal: cheaper, safer than going alone, and often the start of a real friendship. It also means trusting a stranger on a trail where help can be a day's walk away.

Most partnerships go fine. The ones that don't usually fail for predictable reasons: different pace, different budgets, or nobody agreeing on when to turn back. Here's how to check someone out and set things up so the trek works for both of you.

## Before you meet: check the basics online

- **Look at their profile.** On [Trekking Partners Nepal](/find-partners/), every post shows the trekker's name, age, nationality and their own description. A complete profile and a specific post (route, dates, pace) is a good sign. A vague post with no dates isn't.
- **Keep chat on-platform at first.** Reply to their post before swapping WhatsApp or Instagram. Never share your passport, card details or travel documents.
- **Ask about experience.** Where have they trekked before? Highest altitude? How did they feel up there? Honest people give honest, specific answers.
- **Have a video call.** Ten minutes tells you more than a week of messages.

## Meet in person before the trail

If you can, meet in a public place in Kathmandu (Thamel) or Pokhara (Lakeside) a day or two before you start. Have a coffee, walk around, maybe do a short day hike together. It's much easier to say "this won't work" in a café than on day three of a trek.

## Agree on these six things before you start

1. **Pace and daily distance.** Steady five hours a day, or push for long stages?
2. **Acclimatisation.** Agree the rest days now, especially above 3,000 m. Never let a schedule override how someone feels.
3. **Turnaround rules.** If either of you has signs of altitude sickness, you both descend. Agree on a turnaround time on pass days.
4. **Budget and sharing.** How you'll split rooms, food, jeeps and any guide. Teahouse basics, or a bit more comfort?
5. **Splitting up.** It's fine to part ways if it isn't working. Agree that if you do, nobody is left alone on a pass or in bad weather.
6. **Gear and money.** Each person carries their own first aid basics, enough cash for the trek, a headlamp and warm layers. Don't rely on one person for everything.

## On the trail

- **Tell someone at home** your route, dates and partner's name, and check in when you have signal.
- **Register with your accommodation.** Teahouse owners keep track of who's coming and going, which helps if someone goes missing.
- **Keep your own documents and money on you.**
- **Watch each other for altitude sickness:** headache, nausea, unusual tiredness or confusion. Descend early.
- **Trust your instincts.** If someone's behaviour worries you, leave at the next village, tell the lodge owner, and contact us.

## Women trekking with a new partner

Many women trek Nepal with partners they've met online and have a great time. A few extra steps help:

- Meet in a busy public place first, ideally in daylight.
- Share your partner's profile and your itinerary with a friend.
- Book separate rooms if you prefer, and say so upfront.
- Busy trails like Poon Hill, ABC and Langtang have more people around, which many women prefer for a first trek with someone new.

## If you're not sure about anyone

You don't have to choose between a stranger and going alone. You can [join a small-group fixed departure](/fixed-departures/) with [Discover Parbat](https://discoverparbat.com), where a licensed local guide leads and the group is already formed. Or ask questions about a route or safety in our [Community](/community/) first.

## How we keep Trekking Partners Nepal safe

- Every member signs in with Google and creates a profile before they can reply.
- Nobody can see the full list of members or anyone's email address.
- You can report a post or comment, and we review reports quickly.
- Read our [full safety tips](/safety/) for more.

## FAQ

**Is it safe to trek with a stranger in Nepal?**
Generally yes, if you talk first, meet in person in a public place, agree on the basics and keep someone at home informed.

**What if my partner is much faster or slower?**
Talk about it early. Usually the faster person adjusts, or you agree on meeting points each day. On high or remote stages, stay together.

**Should we hire a guide even with a partner?**
For high passes, quiet trails or restricted areas, yes, and sharing one makes it affordable. See [Partner, Guide or Group?](/news/trekking-partner-vs-guide-vs-group-nepal/)$md$,
'trek-news', '{}'::text[], '{}'::text[], '/images/annapurna1.jpg', 'Two trekking partners on a snowy ridge above the hills of Nepal', 'Sameer Regmi', true, false, '2026-10-27')
on conflict (slug) do nothing;

insert into public.news (slug, title, description, body, category, regions, treks, image, image_alt, author, published, featured, published_on)
values ('trekking-in-nepal-november-december', 'Trekking in Nepal in November and December: Where to Go After the Crowds', 'The best treks for November and December in Nepal, what the cold season is like, what to pack and how to find a partner when trails get quiet.',
$md$October gets all the attention, but November and early December are some of the best weeks of the year to trek in Nepal. The skies are usually at their clearest, the trails are quieter once October's crowds leave, and teahouses are easier to book. The trade-off is cold: nights get properly freezing up high, and the big passes start to see snow.

Here's where to go, what to expect and how to find company when fewer people are on the trail.

> **Weather alert for the end of October:** Cyclone Arnab is expected to bring heavy rain in the hills and snow in the high Himalaya from 28 to 31 October, clearing from 1 November. Pause pass crossings and high treks until it clears. Read the [full Cyclone Arnab trekking forecast](https://discoverparbat.com/article/cyclone-arnab-nepal-trekking-weather) from Discover Parbat.

## What November and December are like

- **November:** dry, stable and very clear. Daytime is pleasant in the sun; nights above 4,000 m drop well below freezing. Still busy in the Everest and Annapurna regions, but quieter than October.
- **December:** colder, quieter and still mostly dry. Short days mean earlier starts and earlier finishes. High passes can be snowbound after any storm, so check before you commit.

## Best treks for November

**High classics, while the passes are still open**

- [Everest Base Camp](/everest-region/everest-base-camp/) and [Gokyo Lakes](/everest-region/gokyo-lakes/): crisp views and fewer people than October.
- [Annapurna Circuit](/annapurna-region/annapurna-circuit/): Thorong La is usually crossable in November, but go with a partner or guide and an early start.
- [Manaslu Circuit](/manaslu-region/manaslu-circuit/): a restricted area, so you need a guide and an agency permit. Larkya La gets colder and icier as the month goes on.

**Quieter alternatives**

- [Mardi Himal](/annapurna-region/mardi-himal/): short, steep and spectacular, close to Pokhara.
- [Khopra Danda](/annapurna-region/khopra-danda/): a ridge-top route with big Dhaulagiri views and far fewer trekkers than Poon Hill.
- [Langtang Valley](/langtang-region/langtang-valley/): close to Kathmandu, clear and calm in November.

## Best treks for December

When it gets colder, lower and mid-height treks shine. Clear skies, warm sunny days and no snow on the trail.

- [Poon Hill](/annapurna-region/poon-hill/): easy, short, with sunrise over the Annapurnas.
- [Kokhe Danda](/annapurna-region/kokhe-danda/): a short, uncrowded trek in Parbat with village homestays and close views of Dhaulagiri. Top point 3,309 m.
- [Panchase](/annapurna-region/panchase/): low, forested and quiet, near Pokhara.
- [Everest View Trek](/everest-region/everest-view-trek/): Everest views without going above about 3,900 m.
- [Annapurna Base Camp](/annapurna-region/annapurna-base-camp/): doable in December with warm gear, but watch for avalanche warnings in the gorge after snowfall.

## Gear for the cold season

- A sleeping bag rated to at least −10 °C for anything above 3,500 m
- Down jacket, warm hat and gloves
- Microspikes if you're crossing a pass
- Sunglasses and strong sunscreen, since the sun is fierce on snow
- A power bank, as cold drains batteries fast

## Finding a partner after the crowds leave

This is where it gets harder. In late November and December there are simply fewer people on the trail, so meeting someone at a teahouse is less likely, especially on quieter routes. That's also when a partner matters most: colder nights, quieter trails, fewer people to help if something goes wrong.

- **Post early.** [Add your route and dates](/find-partners/new/) on Trekking Partners Nepal a few weeks before you fly.
- **Be flexible with dates.** "Any start between 20 and 28 Nov" gets more replies than one fixed day.
- **Check posts for your region.** [Browse partner posts](/find-partners/) by region and month.
- **Ask in the [Community](/community/)** about conditions on your route, from people who've just been there.

## Or join a group

If you'd rather not search at all, our [fixed departures](/fixed-departures/) with [Discover Parbat](https://discoverparbat.com) run through the season with a licensed local guide, and solo travellers are welcome. The [Kokhe Danda Trek](https://discoverparbat.com/kokhe-danda-trek) is a great short option for November and December.

## FAQ

**Is November a good time to trek in Nepal?**
Yes. It's one of the clearest, most stable months of the year, and quieter than October.

**Can you trek in Nepal in December?**
Yes. Lower and mid-height treks are excellent. High passes are possible but colder and can close after snow.

**Is Thorong La open in November and December?**
Usually in November. In December it depends on snowfall, and it can close for days after a storm. Check locally before you go.

**Do I need a guide in winter?**
Not legally on the main trails, except in restricted areas. But on high passes in cold, snowy conditions a guide or at least a partner is strongly recommended. See [Do You Need a Guide to Trek in Nepal?](/news/do-you-need-a-guide-trekking-nepal-2026/)$md$,
'trek-news', '{}'::text[], array['everest-base-camp','gokyo-lakes','annapurna-circuit','mardi-himal','khopra-danda','poon-hill','kokhe-danda','langtang-valley']::text[], '/images/langtang1.jpg', 'Snow around a high lake in the Langtang region under a clear sky', 'Sameer Regmi', true, false, '2026-10-27')
on conflict (slug) do nothing;

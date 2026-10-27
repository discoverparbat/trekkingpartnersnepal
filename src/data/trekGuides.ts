// Partner-focused guide content for individual trek pages (Oct 2026).
// Shown on /<region>/<trek>/ below the partner posts, with the FAQ marked up as FAQPage schema.
// Keep this about trekking WITH A PARTNER / SOLO, rules and seasons. Itineraries, prices and
// booking belong on discoverparbat.com (linked via operatorPage), so the two sites don't compete.
// To add a trek: add an entry keyed by its slug from treks.ts. Body text is simple HTML.

export interface TrekGuide {
  sections: { heading: string; html: string }[];
  faq: { q: string; a: string }[];   // answers are plain text (also used in the schema)
}

const GUIDE_RULES = '/news/do-you-need-a-guide-trekking-nepal-2026/';
const RESTRICTED = '/news/restricted-area-treks-nepal-permits-solo/';
const POST = '/find-partners/new/';
const SAFETY = '/news/trekking-partner-safety-nepal/';

export const trekGuides: Record<string, TrekGuide> = {
  // ── Annapurna Base Camp ───────────────────────────────────
  'annapurna-base-camp': {
    sections: [
      {
        heading: 'Who the Annapurna Base Camp trek suits',
        html: `<p>ABC is one of the best first "big" treks in Nepal. You walk up through Gurung villages like Ghandruk and Chhomrong, then into the bamboo and rhododendron forest of the Modi Khola gorge, and finally out into the Annapurna Sanctuary at 4,130 m with Annapurna I, Machapuchare and Hiunchuli all around you.</p>
<p>It's rated moderate, and that's fair, but don't underestimate the stairs. The days around Chhomrong and Sinuwa are thousands of stone steps up and down, which is harder on the knees than the altitude. If you're reasonably fit, walk regularly and are happy with five to seven hours on your feet, you'll be fine. You don't need any previous high-altitude experience.</p>`,
      },
      {
        heading: 'Do you need a guide or permit?',
        html: `<p>No guide is required for ABC, and you don't need a TIMS card. You do need the <strong>ACAP permit</strong> (Annapurna Conservation Area), which you can get yourself at the Nepal Tourism Board office in Pokhara or Kathmandu. Full details in <a href="${GUIDE_RULES}">Do You Need a Guide to Trek in Nepal?</a></p>
<p>The trail is well marked and busy in season, so it isn't hard to follow. We still recommend a local guide, especially on your first trek or in winter, when snow can build up above Deurali.</p>`,
      },
      {
        heading: 'Best months, and when it\'s easiest to find a partner',
        html: `<p><strong>October–November</strong> gives the clearest views and the most trekkers on the trail, so it's the easiest time to find a partner. <strong>March–April</strong> is the other peak, with rhododendrons in bloom and slightly hazier mountains. December to February is quieter and cold at the top but still very doable with warm gear. In the monsoon (June–August) expect rain, leeches and cloud, and far fewer people.</p>
<p>In peak season you'll find people heading to ABC almost every day. In winter and monsoon, <a href="${POST}">post your dates</a> a few weeks ahead.</p>`,
      },
      {
        heading: 'Doing ABC with a partner',
        html: `<ul>
<li><strong>Where to meet:</strong> Pokhara Lakeside is the natural meeting point. Meet there the day before, pick up your ACAP permits together and share a jeep to the trailhead.</li>
<li><strong>What to share:</strong> the jeep or taxi to and from the trailhead, twin rooms in the teahouses, and a guide or porter if you hire one.</li>
<li><strong>Where you can split up:</strong> Chhomrong is the natural junction. One of you can add Poon Hill on the way in, or the Jhinu hot springs on the way out, and you can still share the main stretch to base camp.</li>
<li><strong>Stay together</strong> between Deurali and Machapuchare Base Camp, especially after snowfall. This is the avalanche-prone part of the gorge.</li>
</ul>`,
      },
    ],
    faq: [
      { q: 'Can I trek to Annapurna Base Camp without a guide?', a: 'Yes. A guide is not required on the ABC trail in 2026. You only need the ACAP permit, which you can get yourself in Pokhara or Kathmandu. TIMS is not required.' },
      { q: 'Is Annapurna Base Camp hard for beginners?', a: 'It is moderate. The altitude is manageable at 4,130 m, but the many stone staircases make it tiring. Reasonably fit beginners do it every season.' },
      { q: 'Is ABC good to trek solo?', a: 'In peak season the trail is busy and well marked, so solo trekkers are rarely alone for long. A partner helps with costs and safety, especially in winter.' },
      { q: 'Can I combine Poon Hill and ABC?', a: 'Yes. Many trekkers start via Ghorepani and Poon Hill, then cross to Tadapani and Chhomrong to join the ABC trail.' },
    ],
  },

  // ── Everest Base Camp ─────────────────────────────────────
  'everest-base-camp': {
    sections: [
      {
        heading: 'Who the Everest Base Camp trek suits',
        html: `<p>EBC is the trek most people dream about: Lukla's mountain airstrip, Sherpa villages and monasteries, Namche Bazaar, and the walk up the Khumbu to base camp and the Kala Patthar viewpoint at 5,545 m.</p>
<p>The walking itself isn't technical, and the daily distances are modest. What makes it challenging is altitude. You'll sleep above 4,900 m for several nights, and how your body copes matters far more than your fitness. Anyone in good health who follows a sensible acclimatisation plan, with rest days in Namche and Dingboche, has a good chance. Trekkers who rush are the ones who turn back.</p>`,
      },
      {
        heading: 'Do you need a guide or permit?',
        html: `<p>No guide is required for EBC in 2026, and no TIMS card. You need the <strong>Sagarmatha National Park entry permit</strong>, paid at Monjo, plus a <strong>local municipality fee</strong> paid at Lukla. You can arrange both yourself on the way. See <a href="${GUIDE_RULES}">the 2026 guide and permit rules</a>.</p>
<p>The main trail is very busy and easy to follow. A guide or a partner earns their keep above Dingboche, where altitude sickness becomes a real risk and decisions about turning back matter.</p>`,
      },
      {
        heading: 'Best months, and when it\'s easiest to find a partner',
        html: `<p><strong>October–November</strong> and <strong>late March–May</strong> are the main seasons, with the most stable weather and plenty of trekkers. Finding a partner is easy then. December–January is clear but very cold at the top, and lodges in the higher villages can close. During the monsoon, cloud and cancelled Lukla flights are common.</p>
<p>Lukla flights get delayed by weather in every season, so build in a spare day or two at the end. That's also something partners need to agree on before booking flights.</p>`,
      },
      {
        heading: 'Doing EBC with a partner',
        html: `<ul>
<li><strong>Where to meet:</strong> Kathmandu's Thamel, before you fly. Book your Lukla flights together so you're on the same plane, and agree in advance what you'll do if the flight is delayed.</li>
<li><strong>What to share:</strong> twin rooms in the teahouses, a guide or porter, and a satellite messenger if you carry one.</li>
<li><strong>Where you can split up:</strong> above Lobuche, one of you might want Kala Patthar at sunrise while the other rests. Further down, faster trekkers can head over the Cho La to <a href="/everest-region/gokyo-lakes/">Gokyo</a>.</li>
<li><strong>The one rule:</strong> if either of you shows signs of altitude sickness, you both go down. Agree on this before you leave Lukla. Read our <a href="${SAFETY}">partner safety checklist</a>.</li>
</ul>`,
      },
    ],
    faq: [
      { q: 'Do I need a guide for Everest Base Camp in 2026?', a: 'No. A guide is not mandatory on the Everest Base Camp trail. You need the Sagarmatha National Park permit and the local municipality fee, which you can arrange yourself. TIMS is not required.' },
      { q: 'How hard is the Everest Base Camp trek?', a: 'The walking is not technical, but you sleep above 4,900 m for several nights, so altitude is the real challenge. Follow an acclimatisation plan with rest days in Namche and Dingboche.' },
      { q: 'What is the best month for Everest Base Camp?', a: 'October and November are the most popular, followed by late March to May. Both offer stable weather and many trekkers to team up with.' },
      { q: 'Can I trek EBC solo?', a: 'Yes, legally and practically. In season the trail is busy. A partner or guide is a good idea above Dingboche, where altitude sickness becomes more likely.' },
    ],
  },

  // ── Annapurna Circuit ─────────────────────────────────────
  'annapurna-circuit': {
    sections: [
      {
        heading: 'Who the Annapurna Circuit suits',
        html: `<p>The Circuit is the great all-rounder: rice terraces and waterfalls in the Marsyangdi valley, pine forest and Tibetan-style villages around Manang, a high crossing of the Thorong La at 5,416 m, then the dry, wind-carved Kali Gandaki side down to Muktinath and Jomsom.</p>
<p>It's challenging mainly because of the pass. Thorong La is a long, cold day: you start before dawn from Thorong Phedi or High Camp and climb for several hours in thin air. Before that, the trail is gradual and gives your body time to adjust. It suits fit trekkers with at least a couple of weeks to spare. It's not ideal as a very first trek unless you're comfortable with the altitude plan.</p>`,
      },
      {
        heading: 'Do you need a guide or permit?',
        html: `<p>No guide is required and no TIMS card. You need the <strong>ACAP permit</strong>, which you can get yourself in Pokhara or Kathmandu. See <a href="${GUIDE_RULES}">Do You Need a Guide to Trek in Nepal?</a></p>
<p>We still strongly recommend a guide or at least a partner for the pass. In fresh snow the trail over Thorong La can disappear, and if someone gets altitude sickness on the climb, you don't want to be alone.</p>`,
      },
      {
        heading: 'Best months, and when it\'s easiest to find a partner',
        html: `<p><strong>October–November</strong> is the best time, with clear skies and the pass usually open. <strong>March–April</strong> is the second season, but late snow can close Thorong La for a few days. From December to February the pass is often snowbound, and some high lodges close. The monsoon is wet on the east side, though the Mustang side stays fairly dry.</p>
<p>In peak months, hundreds of trekkers start from Besisahar every week, so partners are easy to find. Outside them, <a href="${POST}">post your dates</a> early.</p>`,
      },
      {
        heading: 'Doing the Circuit with a partner',
        html: `<ul>
<li><strong>Where to meet:</strong> Kathmandu or Pokhara before you take the bus or jeep to Besisahar. Many partnerships also form in <strong>Manang</strong>, where nearly everyone takes an acclimatisation day, and it's a good place to find someone for the pass.</li>
<li><strong>What to share:</strong> jeeps along the road sections, twin rooms, and a guide or porter for the pass.</li>
<li><strong>Where you can split up:</strong> one of you might add the side trip to Tilicho Lake from Manang. After Muktinath, some walk down the Kali Gandaki while others take a jeep or flight from Jomsom.</li>
<li><strong>Stay together on pass day.</strong> Agree on a turnaround time the night before at High Camp or Thorong Phedi.</li>
</ul>`,
      },
    ],
    faq: [
      { q: 'Do I need a guide for the Annapurna Circuit?', a: 'Not legally. In 2026 a guide is not required on the Annapurna Circuit. You need the ACAP permit, which you can get yourself. A guide or partner is strongly recommended for the Thorong La crossing.' },
      { q: 'Is Thorong La open in winter?', a: 'Sometimes. In December to February the pass is often blocked by snow, and it can close for days after a storm. Check conditions locally in Manang before you go up.' },
      { q: 'Where can I find a partner for the Thorong La pass?', a: 'Manang is the best place on the trail, because nearly everyone stops there to acclimatise. You can also post your dates on Trekking Partners Nepal before you start.' },
    ],
  },

  // ── Ghorepani Poon Hill ───────────────────────────────────
  'poon-hill': {
    sections: [
      {
        heading: 'Who the Poon Hill trek suits',
        html: `<p>Poon Hill is Nepal's favourite short trek, and for good reason. In four or five days you climb through Magar and Gurung villages and thick rhododendron forest to Ghorepani, then wake up early for the walk up Poon Hill (3,210 m) to watch the sun hit Dhaulagiri and the Annapurnas.</p>
<p>It's rated easy, and it's the trek we'd suggest for first-timers, families and anyone short on time. The climb from Tikhedhunga to Ulleri is a famous wall of stone steps, so expect one hard morning. Otherwise the days are short and the altitude is low enough that sickness is rarely an issue.</p>`,
      },
      {
        heading: 'Do you need a guide or permit?',
        html: `<p>No guide is needed and no TIMS card. You need the <strong>ACAP permit</strong>, which you can get yourself at the Nepal Tourism Board in Pokhara. See <a href="${GUIDE_RULES}">the 2026 rules</a>.</p>
<p>The trail is busy and well signposted, so it's one of the easiest treks to follow on your own. Even so, a local guide adds a lot here: the stories behind the Magar and Gurung villages, the food and the people you'd otherwise walk past.</p>`,
      },
      {
        heading: 'Best months, and when it\'s easiest to find a partner',
        html: `<p>Poon Hill works for most of the year. <strong>October–December</strong> gives the clearest sunrises. <strong>March–April</strong> is when the rhododendron forest turns red and pink. January and February are cold but often crystal clear. In the monsoon, views are a gamble.</p>
<p>Because it's so popular and starts close to Pokhara, it's the easiest trek to find company for, often at a day's notice. Check the posts on this page, or ask around in Lakeside.</p>`,
      },
      {
        heading: 'Doing Poon Hill with a partner',
        html: `<ul>
<li><strong>Where to meet:</strong> Pokhara Lakeside. Get your ACAP permits together and share a taxi or jeep to the trailhead.</li>
<li><strong>What to share:</strong> transport to and from Pokhara, which costs the same for one or three people, and twin rooms in Ghorepani, which fill up in peak season.</li>
<li><strong>Where you can split up:</strong> Ghorepani and Tadapani are junctions. One of you can continue to <a href="/annapurna-region/annapurna-base-camp/">Annapurna Base Camp</a> or <a href="/annapurna-region/khopra-danda/">Khopra Danda</a> while the other heads down to Ghandruk and back to Pokhara.</li>
<li><strong>Bring head torches</strong> for the pre-dawn walk up Poon Hill, and go up together.</li>
</ul>
<p>Want something quieter than Poon Hill? <a href="/annapurna-region/mohare-danda/">Mohare Danda</a> and <a href="/annapurna-region/kokhe-danda/">Kokhe Danda</a> offer similar Dhaulagiri views with far fewer people.</p>`,
      },
    ],
    faq: [
      { q: 'Do I need a guide for Poon Hill?', a: 'No. Poon Hill is one of the easiest treks in Nepal to do independently. You only need the ACAP permit, which you can get in Pokhara.' },
      { q: 'How many days is the Poon Hill trek?', a: 'Usually four or five days from Pokhara, depending on your route and whether you return via Ghandruk.' },
      { q: 'Is Poon Hill good for beginners?', a: 'Yes. It is short, low in altitude and well marked, which makes it the most popular first trek in Nepal.' },
    ],
  },

  // ── Mardi Himal ───────────────────────────────────────────
  'mardi-himal': {
    sections: [
      {
        heading: 'Who the Mardi Himal trek suits',
        html: `<p>Mardi Himal is a short, steep ridge trek close to Pokhara. You climb through moss-covered forest to Forest Camp and Low Camp, then break out above the trees onto a narrow grassy ridge to High Camp, with Machapuchare (Fishtail) right in front of you. The viewpoint and base camp above High Camp (about 4,500 m) give some of the closest mountain views of any short trek.</p>
<p>It's rated moderate. Days are fairly short, but the trail is steep and the upper ridge is exposed to wind and weather. It suits fit trekkers who want big mountain views in under a week, and people who've done Poon Hill and want something more dramatic.</p>`,
      },
      {
        heading: 'Do you need a guide or permit?',
        html: `<p>No guide is required and no TIMS card. You need the <strong>ACAP permit</strong>, which you can get yourself in Pokhara. See <a href="${GUIDE_RULES}">the 2026 rules</a>.</p>
<p>The trail is clear in good weather, but cloud often rolls up the ridge in the afternoon, and above High Camp the path can be hard to follow in mist or snow. Walk with a partner or guide on the upper section, start early and turn back if the weather closes in.</p>`,
      },
      {
        heading: 'Best months, and when it\'s easiest to find a partner',
        html: `<p><strong>October–November</strong> gives the best, clearest views. <strong>March–April</strong> brings rhododendrons in the lower forest. December–February is cold and can bring snow up high, but on clear days it's stunning. In the monsoon the upper ridge is usually in cloud.</p>
<p>Mardi has become very popular, so finding a partner in peak season is easy. The lodges higher up are small, though, so it pays to coordinate dates with your partner and arrive at High Camp early.</p>`,
      },
      {
        heading: 'Doing Mardi Himal with a partner',
        html: `<ul>
<li><strong>Where to meet:</strong> Pokhara Lakeside. Share a taxi to Kande or Phedi, the usual starting points.</li>
<li><strong>What to share:</strong> transport, rooms at the small upper lodges, and a guide if you'd like one for the ridge.</li>
<li><strong>Where you can split up:</strong> High Camp is the natural split. A stronger walker can push on to Mardi base camp while the other enjoys the closer viewpoint, then meet back at High Camp. On the way down, you can descend via Siding village instead of the way you came.</li>
<li><strong>Go up together</strong> for the pre-dawn walk to the viewpoint, with head torches and warm layers.</li>
</ul>`,
      },
    ],
    faq: [
      { q: 'Can I do Mardi Himal without a guide?', a: 'Yes. A guide is not required. You only need the ACAP permit. Because the upper ridge can be misty and exposed, going with a partner is recommended.' },
      { q: 'How hard is the Mardi Himal trek?', a: 'Moderate. The days are short but steep, and the upper ridge reaches about 4,500 m at base camp, so take it slowly.' },
      { q: 'Is Mardi Himal better than Poon Hill?', a: 'It is more dramatic and higher, with closer views of Machapuchare, but steeper and more exposed. Poon Hill is easier and better for first-timers.' },
    ],
  },

  // ── Langtang Valley ───────────────────────────────────────
  'langtang-valley': {
    sections: [
      {
        heading: 'Who the Langtang Valley trek suits',
        html: `<p>Langtang is the closest big trek to Kathmandu, a day's drive away. The trail climbs from Syabrubesi along the Langtang Khola through forest, into the wide glacial valley of Langtang village and up to Kyanjin Gompa, with its monastery, yak pastures and cheese factory. From there you can climb Kyanjin Ri (4,773 m) or the higher Tserko Ri for huge views of Langtang Lirung.</p>
<p>It's moderate. The climb to Kyanjin is gradual, and the side peaks are optional. It suits trekkers with about a week who want real mountain scenery and Tamang culture without flying to Lukla. Langtang village was rebuilt after the 2015 earthquake, and trekking here directly supports the families who live there.</p>`,
      },
      {
        heading: 'Do you need a guide or permit?',
        html: `<p>No guide is required and no TIMS card. You need the <strong>Langtang National Park permit</strong>, which you can get yourself at the Nepal Tourism Board in Kathmandu or at the park office in Dhunche on the way. See <a href="${GUIDE_RULES}">the 2026 rules</a>.</p>
<p>The valley trail is easy to follow, but a local guide brings the Tamang villages and monasteries to life, and is especially worth it for Tserko Ri or if you continue over to Gosaikunda.</p>`,
      },
      {
        heading: 'Best months, and when it\'s easiest to find a partner',
        html: `<p><strong>October–November</strong> is clear and dry. <strong>March–May</strong> brings rhododendrons and warmer days. Winter is cold at Kyanjin but still possible. In the monsoon the road to Syabrubesi can be blocked by landslides, so check conditions before you set off.</p>
<p>Langtang is quieter than Everest and Annapurna, so there are fewer people to meet on the trail. <a href="${POST}">Post your dates</a> before you leave Kathmandu.</p>`,
      },
      {
        heading: 'Doing Langtang with a partner',
        html: `<ul>
<li><strong>Where to meet:</strong> Kathmandu. You'll leave together on the long drive to Syabrubesi.</li>
<li><strong>What to share:</strong> a private jeep to Syabrubesi, which is far more comfortable than the bus and much cheaper split two or three ways, plus rooms and any guide.</li>
<li><strong>Where you can split up:</strong> Kyanjin Gompa is your base. One of you can climb Tserko Ri while the other does the shorter Kyanjin Ri. On the way back, some partners continue over to <a href="/langtang-region/gosaikunda/">Gosaikunda</a> while others return to Syabrubesi.</li>
<li><strong>Agree on return transport</strong> in advance, as jeeps back to Kathmandu leave early.</li>
</ul>`,
      },
    ],
    faq: [
      { q: 'Do I need a guide for the Langtang Valley trek?', a: 'No. A guide is not required. You need the Langtang National Park permit, which you can get in Kathmandu or at Dhunche. TIMS is not required.' },
      { q: 'How many days is the Langtang trek?', a: 'Usually seven to ten days from Kathmandu, including the drive to Syabrubesi and a day at Kyanjin Gompa.' },
      { q: 'Is Langtang good for solo trekkers?', a: 'Yes, the trail is easy to follow, but it is quieter than Everest or Annapurna, so it is worth finding a partner before you leave Kathmandu.' },
    ],
  },

  // ── Gokyo Lakes ───────────────────────────────────────────
  'gokyo-lakes': {
    sections: [
      {
        heading: 'Who the Gokyo Lakes trek suits',
        html: `<p>Gokyo is the Everest region's quieter, arguably more beautiful alternative to Everest Base Camp. From Namche Bazaar you head up the Dudh Koshi valley to a chain of turquoise glacial lakes beside the Ngozumpa glacier, the longest in Nepal. The climb up Gokyo Ri (5,357 m) at sunrise gives one of the best views in the Himalaya: Everest, Lhotse, Makalu and Cho Oyu in one sweep.</p>
<p>It's challenging because of altitude, not technical difficulty. The days are short by design, to help you acclimatise. It suits trekkers who want the Everest views with fewer crowds than EBC, and people with time to combine both via the Cho La pass.</p>`,
      },
      {
        heading: 'Do you need a guide or permit?',
        html: `<p>No guide is required and no TIMS card. As for <a href="/everest-region/everest-base-camp/">Everest Base Camp</a>, you need the <strong>Sagarmatha National Park permit</strong> (at Monjo) and the <strong>local municipality fee</strong> (at Lukla). See <a href="${GUIDE_RULES}">the 2026 rules</a>.</p>
<p>The valley trail to Gokyo is straightforward. If you plan to cross the <strong>Cho La</strong> or <strong>Renjo La</strong> passes, go with a guide or experienced partner, especially when there's snow or ice.</p>`,
      },
      {
        heading: 'Best months, and when it\'s easiest to find a partner',
        html: `<p><strong>October–November</strong> and <strong>late March–May</strong> are best. In winter the lakes freeze and it's very cold, but skies are often clear. The passes can be icy and some lodges close.</p>
<p>Fewer people go to Gokyo than to EBC, so finding a partner on the trail is less certain. Many Gokyo partnerships start in Namche, where trekkers rest for a day and compare plans. Or <a href="${POST}">post your dates</a> before you fly to Lukla.</p>`,
      },
      {
        heading: 'Doing Gokyo with a partner',
        html: `<ul>
<li><strong>Where to meet:</strong> Kathmandu, so you can share the Lukla flight, or Namche Bazaar on your acclimatisation day.</li>
<li><strong>What to share:</strong> rooms, a guide for the passes, and the cost of any porter.</li>
<li><strong>Where you can split up:</strong> at Gokyo, one partner might cross the Cho La towards EBC while the other returns down the valley or heads over the Renjo La to Thame. Never split so that someone crosses a pass alone.</li>
<li><strong>Climb Gokyo Ri together</strong> before dawn, and agree a turnaround time if either of you is feeling the altitude.</li>
</ul>`,
      },
    ],
    faq: [
      { q: 'Do I need a guide for the Gokyo Lakes trek?', a: 'No. A guide is not required on the Gokyo trail. You need the Sagarmatha National Park permit and local municipality fee. A guide is recommended for the Cho La and Renjo La passes.' },
      { q: 'Is Gokyo better than Everest Base Camp?', a: 'Many trekkers think so. It is quieter, with turquoise lakes and a wider Everest view from Gokyo Ri. EBC has the base camp itself and more trekkers to meet.' },
      { q: 'Can I combine Gokyo and Everest Base Camp?', a: 'Yes, via the Cho La pass. It adds a few days and a demanding pass crossing, so go with a guide or experienced partner.' },
    ],
  },

  // ── Manaslu Circuit (restricted) ──────────────────────────
  'manaslu-circuit': {
    sections: [
      {
        heading: 'Who the Manaslu Circuit suits',
        html: `<p>Manaslu is the circuit people pick when they want the scale of the Annapurna Circuit without the road and the crowds. The trail follows the Budhi Gandaki gorge from Soti Khola or Machha Khola, climbs into Tibetan Buddhist villages like Lho, Samagaun and Samdo below Manaslu (8,163 m), crosses the Larkya La (5,106 m), and drops into the Annapurna region at Dharapani.</p>
<p>It's challenging: long days, real altitude, and a big pass day. It suits trekkers with some previous trekking experience and around two weeks, who are happy with simpler teahouses in the remote sections.</p>`,
      },
      {
        heading: 'Do you need a guide or permit?',
        html: `<p><strong>Yes, Manaslu is a restricted area.</strong> You need a <strong>restricted-area permit</strong>, which only a registered trekking agency can apply for, and a <strong>licensed guide</strong> must walk with you. You also need the Manaslu Conservation Area permit, and the Annapurna Conservation Area permit for the exit via Dharapani. TIMS is not required.</p>
<p>Since 2026, a <strong>single trekker can get the permit</strong> through an agency. You no longer need a second person to apply. Read <a href="${RESTRICTED}">Restricted Area Treks in Nepal</a> for how it works.</p>`,
      },
      {
        heading: 'Best months, and when it\'s easiest to find a partner',
        html: `<p><strong>Late September–November</strong> is the main season, with the most stable weather for the Larkya La. <strong>March–May</strong> is the second season. In winter the pass is often snowbound, and in the monsoon the lower gorge has landslide risk.</p>
<p>Because everyone needs an agency and guide, partners usually team up before the trek, not on the trail. Post your dates two to four weeks ahead so you can apply for the permit together.</p>`,
      },
      {
        heading: 'Doing Manaslu with a partner',
        html: `<ul>
<li><strong>Why it matters here:</strong> with a guide required, a partner is the single biggest cost saving. You split the guide's daily fee, food and lodging, plus the jeep to the trailhead.</li>
<li><strong>Where to meet:</strong> Kathmandu, where your agency will hand over the permits. Meet a day or two early to check you're a good match.</li>
<li><strong>Get on one permit:</strong> apply through the same agency so you share the same guide and paperwork.</li>
<li><strong>Splitting up:</strong> inside the restricted area you stay with your guide, so plan the trip as a team. Some pairs add <a href="/manaslu-region/tsum-valley/">Tsum Valley</a> together at the start.</li>
</ul>`,
      },
    ],
    faq: [
      { q: 'Can I trek the Manaslu Circuit solo?', a: 'You can now get the Manaslu restricted-area permit as a single trekker, through a registered agency. A licensed guide must still go with you, so you will not be completely alone.' },
      { q: 'Which permits do I need for Manaslu?', a: 'The Manaslu restricted-area permit (through an agency), the Manaslu Conservation Area permit and the Annapurna Conservation Area permit for the exit. TIMS is not required.' },
      { q: 'How can I make the Manaslu Circuit cheaper?', a: 'Find a partner and go on the same permit with one guide. Splitting the guide, transport and agency costs two or three ways makes the biggest difference.' },
    ],
  },

  // ── Upper Mustang (restricted) ────────────────────────────
  'upper-mustang': {
    sections: [
      {
        heading: 'Who the Upper Mustang trek suits',
        html: `<p>Upper Mustang, the former Kingdom of Lo, feels like a different country: red and ochre cliffs, cave dwellings, old monasteries, barley fields and the walled city of Lo Manthang at 3,840 m. It sits in the rain shadow north of the Annapurnas, so it's dry, wind-blown and very different from the rest of Nepal.</p>
<p>It's moderate. The altitude is lower than the big passes, but days are long, dusty and windy. It suits trekkers interested in culture and landscape more than snow peaks, photographers, and anyone who wants to trek during the monsoon, when most of Nepal is wet.</p>`,
      },
      {
        heading: 'Do you need a guide or permit?',
        html: `<p><strong>Yes, Upper Mustang is a restricted area.</strong> You need a <strong>restricted-area permit</strong> through a registered agency, a <strong>licensed guide</strong>, and the <strong>ACAP permit</strong>. The restricted permit for Upper Mustang is one of the most expensive in Nepal, but it's now charged <strong>per day (USD 50 per person per day)</strong> instead of a fixed 10-day block, so shorter trips cost less. TIMS is not required.</p>
<p>Since 2026 a <strong>single trekker can apply</strong> through an agency. See <a href="${RESTRICTED}">Restricted Area Treks in Nepal</a>.</p>`,
      },
      {
        heading: 'Best months, and when it\'s easiest to find a partner',
        html: `<p>Upper Mustang can be trekked from <strong>March to November</strong>. Spring and autumn are clearest. In the <strong>monsoon (June–August)</strong> it stays mostly dry, making it one of the few good treks for that season. May is popular for the Tiji festival in Lo Manthang. Winter is very cold, and many locals move south.</p>
<p>With the high permit cost and a guide required, partners almost always team up in advance. Post early, so you can apply on one permit.</p>`,
      },
      {
        heading: 'Doing Upper Mustang with a partner',
        html: `<ul>
<li><strong>Why it matters here:</strong> the permit is per person per day, but the guide, jeeps and agency costs can all be shared. On a trek this expensive, a partner makes a big difference.</li>
<li><strong>Where to meet:</strong> Pokhara, before flying or driving to Jomsom together. The restricted area starts just beyond Kagbeni.</li>
<li><strong>What to share:</strong> the guide, jeeps on the road sections, and rooms.</li>
<li><strong>Agree on the trip style:</strong> walk the whole way, or use jeeps on dusty road sections? Decide this before applying: the permit is charged per day, so jeeping the road sections means fewer days and a cheaper permit.</li>
</ul>`,
      },
    ],
    faq: [
      { q: 'Can I trek Upper Mustang alone?', a: 'You can now get the permit as a single trekker through a registered agency, but a licensed guide must go with you.' },
      { q: 'Can you trek Upper Mustang in the monsoon?', a: 'Yes. Upper Mustang lies in the rain shadow of the Annapurnas and stays mostly dry from June to August, which makes it one of the best monsoon treks in Nepal.' },
      { q: 'How much is the Upper Mustang permit?', a: 'The Upper Mustang restricted-area permit is now USD 50 per person per day, instead of a fixed 10-day block, so shorter trips cost less. You also need the ACAP permit. Sharing the guide and transport with a partner reduces the total cost.' },
    ],
  },

  // ── Kokhe Danda ───────────────────────────────────────────
  // Keep this page about partners/solo/permits. The main Kokhe Danda Trek page (itinerary, cost, booking)
  // lives on discoverparbat.com – link to it, don't repeat it.
  'kokhe-danda': {
    sections: [
      {
        heading: 'Who Kokhe Danda suits',
        html: `<p>Kokhe Danda is a short, quiet ridge trek in Parbat district, west of Pokhara. The highest point is 3,309 m, with close views of Dhaulagiri and the Annapurna range. What makes it special is the village life: homestays in Haljure and time with Magar families in Lespar, on a route that sees only a handful of trekkers. The full itinerary and cost are on the <a href="https://discoverparbat.com/kokhe-danda-trek">Kokhe Danda Trek</a> page from Discover Parbat, the local company that opened the trail.</p>
<p>It's easy enough for first-timers, families and anyone with a few days to spare, and a good alternative if you want <a href="/annapurna-region/poon-hill/">Poon Hill</a>-style views without the crowds.</p>`,
      },
      {
        heading: 'Do you need a guide or permit?',
        html: `<p>The 5-day route doesn't pass through a conservation area or national park, so it <strong>needs no permit</strong>. A shorter variant that goes via Nayapul enters the Annapurna Conservation Area and needs ACAP. No TIMS card is needed either way.</p>
<p>A guide isn't legally required, but this is a <strong>new, quiet trail</strong> with few signposts, and homestays are arranged locally. A local guide makes it much easier, and much richer culturally.</p>`,
      },
      {
        heading: 'Best months, and when it\'s easiest to find a partner',
        html: `<p>Kokhe Danda is good from <strong>October to May</strong>. October–December brings the clearest mountain views, and spring brings rhododendrons on the ridge. Because the top is only 3,309 m, it's also a good winter option when the high treks are snowbound.</p>
<p>It's a quiet trail, so you won't meet many people on it. That makes finding a partner beforehand, or joining a group, more useful than on busy treks.</p>`,
      },
      {
        heading: 'Doing Kokhe Danda with a partner or group',
        html: `<ul>
<li><strong>Where to meet:</strong> Pokhara. The trek starts from there, so meet in Lakeside the day before.</li>
<li><strong>What to share:</strong> the transport to the trailhead and a local guide.</li>
<li><strong>Easiest option:</strong> join a <a href="/fixed-departures/">fixed departure</a> with Discover Parbat. It runs on set dates with a local guide and homestays arranged, and solo travellers are welcome. See the dates in the box on this page.</li>
<li><strong>Combine it:</strong> with 7–8 days you can pair Kokhe Danda with <a href="/annapurna-region/khopra-danda/">Khopra Danda</a>, a longer and quieter alternative to the classic Annapurna treks. Discover Parbat has the <a href="https://discoverparbat.com/khopra-ridge-trek">Khopra Ridge Trek</a> details.</li>
</ul>`,
      },
    ],
    faq: [
      { q: 'Do I need a permit for Kokhe Danda?', a: 'The 5-day route needs no permit, because it does not enter a conservation area or national park. A shorter variant via Nayapul enters the Annapurna Conservation Area and needs ACAP. TIMS is not required.' },
      { q: 'How high is Kokhe Danda?', a: 'The highest point is 3,309 m, which is low enough that altitude sickness is rarely a problem.' },
      { q: 'Can I join a group for Kokhe Danda?', a: 'Yes. Discover Parbat runs fixed departures on set dates with a local guide and homestays included. Solo travellers are welcome.' },
    ],
  },
  // ── Khopra Danda ──────────────────────────────────────────
  // Main itinerary/cost lives on discoverparbat.com/khopra-ridge-trek – link, don't repeat.
  'khopra-danda': {
    sections: [
      {
        heading: 'Who Khopra Danda suits',
        html: `<p>Khopra Danda (Khopra Ridge) is what Poon Hill was before the crowds. The trail climbs through rhododendron forest and Magar villages to a grassy ridge at 3,667 m, where community lodges look straight across the Kali Gandaki gorge to Dhaulagiri, with Annapurna South and Nilgiri close by. Fit trekkers can add a hard side trip to the sacred Khayer Lake at 4,653 m. The itinerary and cost are on Discover Parbat's <a href="https://discoverparbat.com/khopra-ridge-trek">Khopra Ridge Trek</a> page.</p>
<p>It's moderate. Most trekkers take 7–9 days from Pokhara. The climbs are steeper than on Poon Hill, but you sleep no higher than the ridge itself unless you go for Khayer Lake. It suits people who've done or skipped Poon Hill and want the same mountains with far fewer people, and anyone who likes simple community lodges over busy teahouse villages.</p>`,
      },
      {
        heading: 'Do you need a guide or permit?',
        html: `<p>Khopra lies inside the Annapurna Conservation Area, so you need the <strong>ACAP permit</strong>, which you can get yourself in Pokhara. No TIMS card. A guide isn't legally required. See <a href="${GUIDE_RULES}">the 2026 rules</a>.</p>
<p>We do recommend a guide, or at least a partner. The trail is quiet and less signposted than the main Annapurna routes, cloud often fills the forest in the afternoon, and the <strong>Khayer Lake</strong> side trip is a long, high day on a faint trail. Don't do that part alone.</p>`,
      },
      {
        heading: 'Best months, and when it\'s easiest to find a partner',
        html: `<p><strong>October–December</strong> gives the clearest Dhaulagiri views. Khopra stays good later into December than the high treks. <strong>March–April</strong> brings rhododendron forest in full bloom. Winter is cold on the ridge but often clear. Khayer Lake can be snowbound from December to March.</p>
<p>Khopra is a quiet trek, so you won't meet many people heading the same way. <a href="${POST}">Post your dates</a> before you leave Pokhara, or join a group departure.</p>`,
      },
      {
        heading: 'Doing Khopra with a partner',
        html: `<ul>
<li><strong>Where to meet:</strong> Pokhara. Pick up ACAP permits together and share transport to the trailhead.</li>
<li><strong>What to share:</strong> transport, rooms at the community lodges (they're small, so coordinate dates), and a local guide.</li>
<li><strong>Where you can split up:</strong> at Khopra, one of you can do Khayer Lake with a guide while the other rests on the ridge. Many routes link with Ghorepani, so a partner short on time can walk out via Poon Hill.</li>
<li><strong>Make it longer:</strong> with 7–8 days you can pair Khopra with <a href="/annapurna-region/kokhe-danda/">Kokhe Danda</a> in Parbat for a quiet, village-focused alternative to the classic Annapurna treks.</li>
</ul>`,
      },
    ],
    faq: [
      { q: 'Do I need a guide for Khopra Danda?', a: 'Not legally. You need the ACAP permit, which you can get in Pokhara. Because the trail is quiet and the Khayer Lake side trip is high and faint, a guide or partner is recommended.' },
      { q: 'How high is Khopra Ridge?', a: 'The ridge is at 3,667 m. The optional Khayer Lake side trip reaches 4,653 m.' },
      { q: 'Is Khopra Danda better than Poon Hill?', a: 'It is quieter and closer to Dhaulagiri, with simple community lodges, but longer and steeper. Poon Hill is easier and better for a very short first trek.' },
    ],
  },

  // ── Mohare Danda ──────────────────────────────────────────
  'mohare-danda': {
    sections: [
      {
        heading: 'Who Mohare Danda suits',
        html: `<p>Mohare Danda is a community eco-trek in Myagdi, on a forested ridge at about 3,300 m with views of Dhaulagiri, Annapurna South and Machapuchare. Instead of a string of busy teahouse villages, you stay in small community-run lodges and homestays along the way, where the income goes back into the villages.</p>
<p>It's easy. The classic route takes 5 days, starting at Galeshwor and finishing at Baiseri via Tikot. It suits first-timers, families and anyone who wants Poon Hill-style sunrises without the crowds, plus some real village time along the way.</p>`,
      },
      {
        heading: 'Do you need a guide or permit?',
        html: `<p>No TIMS card is needed, and a guide isn't legally required. The classic 5-day route from Galeshwor to Baiseri via Tikot <strong>needs no permit</strong>. You only need the <strong>ACAP permit</strong> if you exit towards Ghorepani or Nayapul, and you can get it yourself in Pokhara. See <a href="${GUIDE_RULES}">the 2026 rules</a>.</p>
<p>It's a quiet trail with few signs and junctions in the forest, and accommodation is arranged locally, so a local guide makes it much smoother.</p>`,
      },
      {
        heading: 'Best months, and when it\'s easiest to find a partner',
        html: `<p>Mohare is good from <strong>October to May</strong>. October–December gives the clearest views. March–April is rhododendron season. At around 3,300 m it's also a good winter choice when high treks are snowbound.</p>
<p>Very few trekkers walk this ridge compared with Poon Hill, so team up before you go. <a href="${POST}">Post your dates</a>, or ask in the <a href="/community/">Community</a> about current lodge openings.</p>`,
      },
      {
        heading: 'Doing Mohare Danda with a partner',
        html: `<ul>
<li><strong>Where to meet:</strong> Pokhara, then travel to the trailhead at Galeshwor together.</li>
<li><strong>What to share:</strong> transport, a local guide and homestay rooms.</li>
<li><strong>Where you can split up:</strong> Mohare links to the Poon Hill and Khopra trails, so one partner can head to Ghorepani or <a href="/annapurna-region/khopra-danda/">Khopra Danda</a> while the other finishes the classic route at Baiseri. Whoever exits towards Ghorepani or Nayapul needs the ACAP permit.</li>
<li><strong>Be flexible:</strong> lodges are small, so confirm beds a day ahead through your guide or host.</li>
</ul>`,
      },
    ],
    faq: [
      { q: 'Is Mohare Danda better than Poon Hill?', a: 'It has similar mountain views with far fewer people and more village time, but fewer facilities. Poon Hill is busier and better signposted.' },
      { q: 'Do I need a permit for Mohare Danda?', a: 'The classic 5-day route from Galeshwor to Baiseri via Tikot needs no permit. You only need ACAP if you exit towards Ghorepani or Nayapul. TIMS is not required.' },
      { q: 'How many days is the Mohare Danda trek?', a: 'The classic route takes 5 days, from Galeshwor to Baiseri via Tikot. Linking to Ghorepani or Khopra makes it longer.' },
    ],
  },

  // ── Api Himal Base Camp ───────────────────────────────────
  // Main itinerary/cost lives on discoverparbat.com/api-himal-base-camp-trek – link, don't repeat.
  'api-himal-base-camp': {
    sections: [
      {
        heading: 'Who the Api Himal Base Camp trek suits',
        html: `<p>Api Himal Base Camp is one of Nepal's most remote treks, in Darchula in the far-western corner of the country. The route follows the Mahakali river, which forms the border with India, then climbs through forest and pasture to around 4,000 m at the base of Api Himal (7,132 m) in the Api Nampa Conservation Area. You'll pass through villages that see very few foreigners. Full details are on Discover Parbat's <a href="https://discoverparbat.com/api-himal-base-camp-trek">Api Himal Base Camp Trek</a> page.</p>
<p>It's challenging, mostly because of the remoteness: long travel days to get there, basic homestays and camping instead of teahouses, and few people around if something goes wrong. It suits experienced trekkers who want true wilderness and culture far from the crowds.</p>`,
      },
      {
        heading: 'Do you need a guide or permit?',
        html: `<p>The only permit you need is the <strong>Api Nampa Conservation Area permit</strong>. No restricted-area permit and no TIMS card. See <a href="${GUIDE_RULES}">the 2026 rules</a>.</p>
<p>A guide isn't legally required, but we'd strongly recommend one here. Trails are unmarked, there are no teahouses on the upper sections, food and camping need arranging, and few people speak English.</p>`,
      },
      {
        heading: 'Best months, and when it\'s easiest to find a partner',
        html: `<p>The best windows are <strong>April–May</strong> and <strong>October–November</strong>. In the monsoon the roads into Darchula are often blocked by landslides, and in winter the upper route is snowbound.</p>
<p>Very few trekkers go to Api Himal in any season, so you won't meet partners on the trail. Plan it as a team from the start: <a href="${POST}">post your dates</a> a month or more ahead.</p>`,
      },
      {
        heading: 'Doing Api Himal with a partner',
        html: `<ul>
<li><strong>Why it matters here:</strong> remote treks cost more for one person. A partner splits the guide, porters, camping gear and the long private transport into Darchula.</li>
<li><strong>Where to meet:</strong> Kathmandu, or Dhangadhi if you're both flying west. From there it's a long road journey north.</li>
<li><strong>Agree on contingency days:</strong> roads and weather in the far west are unpredictable. Build in spare days and agree how you'll handle delays.</li>
<li><strong>Don't split up</strong> on this trek. There's nobody else on the trail to fall back on.</li>
</ul>`,
      },
    ],
    faq: [
      { q: 'Where is Api Himal Base Camp?', a: 'In Darchula district in far-western Nepal, inside the Api Nampa Conservation Area, near the borders with India and Tibet.' },
      { q: 'Do I need a guide for Api Himal Base Camp?', a: 'A guide is strongly recommended. The trails are unmarked, accommodation is basic or camping, and very few people trek there. The only permit needed is the Api Nampa Conservation Area permit.' },
      { q: 'Which permits do I need for Api Himal Base Camp?', a: 'Only the Api Nampa Conservation Area permit. No restricted-area permit or TIMS card is needed.' },
      { q: 'How many days does the Api Himal trek take?', a: 'Usually 12 to 16 days including the long journey to Darchula and back.' },
    ],
  },

  // ── Nar Phu Valley (restricted) ───────────────────────────
  'nar-phu-valley': {
    sections: [
      {
        heading: 'Who the Nar Phu Valley trek suits',
        html: `<p>Nar Phu is a hidden side valley off the Annapurna Circuit. From Koto, near Chame, a narrow canyon trail leads up to the stone villages of Phu and Nar, with Tibetan-style houses, prayer flags and old monasteries like Tashi Lhakhang. Most routes then cross the Kang La (5,320 m) and come down at Ngawal on the upper Circuit.</p>
<p>It's challenging, with real altitude, simple lodges and a big pass. It suits trekkers who want something wilder than the main Circuit and are happy to combine it with Manang or Thorong La.</p>`,
      },
      {
        heading: 'Do you need a guide or permit?',
        html: `<p><strong>Yes, Nar Phu is a restricted area.</strong> You need a <strong>restricted-area permit</strong> through a registered agency, a <strong>licensed guide</strong>, and the <strong>ACAP permit</strong>. TIMS is not required.</p>
<p>Since 2026, a <strong>single trekker can apply</strong> through an agency. Read <a href="${RESTRICTED}">Restricted Area Treks in Nepal</a>.</p>`,
      },
      {
        heading: 'Best months, and when it\'s easiest to find a partner',
        html: `<p><strong>Late September–November</strong> and <strong>March–May</strong> are best. The Kang La can be snowbound in winter and early spring. In the monsoon the lower canyon can be affected by rockfall.</p>
<p>Because of the agency and guide rules, partners need to team up before the permit is issued. <a href="${POST}">Post your dates</a> two to four weeks ahead.</p>`,
      },
      {
        heading: 'Doing Nar Phu with a partner',
        html: `<ul>
<li><strong>Why it matters here:</strong> sharing one guide and one permit application is the biggest saving on any restricted trek.</li>
<li><strong>Where to meet:</strong> Kathmandu or Pokhara, where your agency issues the permit, then travel together towards Besisahar and Koto.</li>
<li><strong>Where you can split up:</strong> once you come down from the Kang La at Ngawal, you're back on the open Annapurna Circuit. One partner can continue over Thorong La while the other heads down. Agree on this with your agency in advance, since it affects the guide's days.</li>
<li><strong>Cross Kang La together</strong> with your guide, and agree a turnaround time.</li>
</ul>`,
      },
    ],
    faq: [
      { q: 'Can I trek Nar Phu solo?', a: 'You can now get the restricted-area permit as a single trekker through a registered agency, but a licensed guide must go with you.' },
      { q: 'Can I combine Nar Phu with the Annapurna Circuit?', a: 'Yes. Most trekkers cross the Kang La to Ngawal and then continue over Thorong La on the Annapurna Circuit.' },
      { q: 'Which permits do I need for Nar Phu?', a: 'The Nar Phu restricted-area permit through an agency, plus the ACAP permit. TIMS is not required.' },
    ],
  },

  // ── Tsum Valley (restricted) ──────────────────────────────
  'tsum-valley': {
    sections: [
      {
        heading: 'Who the Tsum Valley trek suits',
        html: `<p>Tsum is a sacred Buddhist valley near the Tibetan border, branching off the Manaslu trail. Villages like Chhokangparo and Nile sit among long mani walls and chortens, and the trek reaches Mu Gompa at about 3,700 m. Rachen Gompa, a nunnery, is one of the highlights. There's no high pass, which makes it gentler than the Manaslu Circuit.</p>
<p>It's moderate. Most of the challenge is the long approach up the Budhi Gandaki gorge. It suits trekkers who want culture and peace more than summits, and those combining it with the <a href="/manaslu-region/manaslu-circuit/">Manaslu Circuit</a>.</p>`,
      },
      {
        heading: 'Do you need a guide or permit?',
        html: `<p><strong>Yes, Tsum is a restricted area.</strong> You need a <strong>restricted-area permit</strong> through a registered agency, a <strong>licensed guide</strong>, and the <strong>Manaslu Conservation Area permit</strong>. TIMS is not required.</p>
<p>Since 2026, a <strong>single trekker can apply</strong> through an agency. See <a href="${RESTRICTED}">Restricted Area Treks in Nepal</a>.</p>`,
      },
      {
        heading: 'Best months, and when it\'s easiest to find a partner',
        html: `<p><strong>Late September–November</strong> and <strong>March–May</strong> are best. Tsum is lower than Manaslu, so it's a little more forgiving at the edges of the season, but the approach gorge has landslide risk in the monsoon.</p>
<p>Many Tsum trekkers also do Manaslu, so you can look for partners for either. <a href="${POST}">Post your dates</a> early so you can share a permit.</p>`,
      },
      {
        heading: 'Doing Tsum with a partner',
        html: `<ul>
<li><strong>Why it matters here:</strong> you're paying for a guide either way, so a partner halves that cost and the jeep to the trailhead.</li>
<li><strong>Where to meet:</strong> Kathmandu, where the agency hands over permits, then drive together towards Soti Khola or Machha Khola.</li>
<li><strong>Plan the whole route together:</strong> Tsum on its own, or Tsum plus the Manaslu Circuit. The permit and guide days depend on this, so agree before you apply.</li>
<li><strong>Respect local customs:</strong> walk clockwise around mani walls and chortens, and ask before photographing people or monasteries.</li>
</ul>`,
      },
    ],
    faq: [
      { q: 'Can I trek Tsum Valley solo?', a: 'You can now get the restricted-area permit as a single trekker through a registered agency, but a licensed guide must go with you.' },
      { q: 'Can I combine Tsum Valley and the Manaslu Circuit?', a: 'Yes. Tsum branches off the Manaslu trail, so many trekkers do Tsum first and then continue around Manaslu over the Larkya La.' },
      { q: 'How high is Tsum Valley?', a: 'The highest usual point is Mu Gompa at about 3,700 m. There is no high pass on the Tsum-only route.' },
    ],
  },
};

export const getTrekGuide = (slug: string) => trekGuides[slug];

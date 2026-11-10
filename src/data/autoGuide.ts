// Partner-focused guide for treks that don't have a hand-written one in trekGuides.ts yet.
// Built only from the facts already in treks.ts (days, altitude, difficulty, season, restricted),
// so every trek page answers the searches trekkers actually make: "<trek> trekking partner",
// "<trek> solo", "do I need a guide for <trek>". A hand-written guide in trekGuides.ts always
// replaces this one – write those for the treks that get the most visits.
import type { TrekGuide } from './trekGuides';
import { trekTitle, type Trek } from './treks';

const GUIDE_RULES = '/news/do-you-need-a-guide-trekking-nepal-2026/';
const RESTRICTED = '/news/restricted-area-treks-nepal-permits-solo/';
const POST = '/find-partners/new/';
const SAFETY = '/news/trekking-partner-safety-nepal/';

// "in the Annapurna region", "in eastern Nepal" …
const WHERE: Record<string, string> = {
  'annapurna-region': 'the Annapurna region',
  'everest-region': 'the Everest region',
  'manaslu-region': 'the Manaslu region',
  'dhaulagiri-region': 'the Dhaulagiri region',
  'langtang-region': 'the Langtang and central hills',
  'eastern-nepal': 'eastern Nepal',
  'western-nepal': 'western Nepal',
};

// Short, well-used routes where you'll usually meet other trekkers in season.
// Every other trek without a hand-written guide is a quieter trail.
const BUSY = new Set(['everest-view-trek', 'nagarkot-chisapani']);

/** First number in "approx. 4,350 m (Kang La)" → 4350 */
const firstNumber = (s: string) => Number((s.match(/[\d,]+/)?.[0] ?? '0').replace(/,/g, '')) || 0;

export function autoGuide(trek: Trek): TrekGuide {
  const name = trek.name;
  const title = trekTitle(trek);
  const where = WHERE[trek.region] ?? 'Nepal';
  const quiet = !BUSY.has(trek.slug);
  const high = firstNumber(trek.maxAltitude) >= 4000;
  const long = firstNumber(trek.days) >= 14;
  const hard = trek.difficulty === 'Challenging' || trek.difficulty === 'Strenuous';
  const level = trek.difficulty.toLowerCase();

  const finding = quiet
    ? `<p>Fewer people walk ${name} than the classic Annapurna and Everest routes, so you're unlikely to meet a partner on the trail itself. Plan it together from the start: <a href="${POST}">post your dates</a> a month or more ahead, say how flexible you are, and check back for replies.</p>`
    : `<p>This is a short, well-used route, so in season you'll usually see other trekkers along the way. A partner mainly helps you share transport and rooms, and makes the walk more fun. <a href="${POST}">Post your dates</a> a couple of weeks ahead.</p>`;

  const permits = trek.restricted
    ? `<p>${name} is in a <strong>restricted area</strong>. You need a special permit that only a registered trekking agency can apply for, and a licensed guide must walk with you. Since 2026 a single trekker can get the permit too, but going with a partner splits the guide's cost. See <a href="${RESTRICTED}">how restricted-area permits work</a>.</p>`
    : `<p>A licensed guide isn't mandatory on ${name} in 2026, and you don't need a TIMS card. You'll still need the entry permit for any conservation area or national park the route passes through, which you can get yourself. Full details in <a href="${GUIDE_RULES}">Do You Need a Guide to Trek in Nepal?</a></p>
<p>We still recommend a local guide${quiet ? ', especially on a quieter trail like this one, where signposts are rare and you may not see other trekkers all day' : ''}.</p>`;

  const tips = [
    `<li><strong>Agree on the plan before you go:</strong> dates, daily pace, budget, and whether you'll share a guide or porter. A quick video call before you meet saves surprises.</li>`,
    `<li><strong>What to share:</strong> transport to and from the trailhead, twin rooms in teahouses or homestays, and a guide${trek.restricted ? ' (required here)' : ' if you hire one'}.</li>`,
    high
      ? `<li><strong>Altitude rule:</strong> ${name} goes up to ${trek.maxAltitude}. If either of you shows signs of altitude sickness, you both go down. Agree on this before you start.</li>`
      : trek.difficulty === 'Easy'
        ? `<li><strong>Good first trek together:</strong> at ${trek.maxAltitude}, ${name} is an easy way to find out how you walk together before trying something bigger.</li>`
        : `<li><strong>Agree on the daily stages:</strong> at ${trek.maxAltitude} altitude is less of a worry, so the things to settle are how far you'll walk each day and where you'll rest.</li>`,
    long
      ? `<li><strong>Build in spare days:</strong> at ${trek.days} days, weather, roads and flights can all cause delays. Agree how many spare days you have and what you'll do if you run out.</li>`
      : '',
    quiet || hard
      ? `<li><strong>Stay together</strong> on remote or high sections, and carry a way to call for help. Read our <a href="${SAFETY}">partner safety checklist</a>.</li>`
      : `<li><strong>Meet in a public place first</strong> and share your plans with someone at home. Read our <a href="${SAFETY}">partner safety checklist</a>.</li>`,
  ].filter(Boolean).join('\n');

  return {
    sections: [
      {
        heading: `Finding a trekking partner for ${title}`,
        html: `<p>${title} is ${/^(8|11|18)/.test(trek.days) ? 'an' : 'a'} ${trek.days}-day, ${level} trek in ${where}, reaching ${trek.maxAltitude}. The usual seasons are <strong>${trek.season}</strong>, and that's also when you're most likely to find someone heading the same way.</p>
${finding}`,
      },
      { heading: `Do you need a guide or permit for ${name}?`, html: permits },
      { heading: `Trekking ${name} with a partner`, html: `<ul>\n${tips}\n</ul>` },
    ],
    faq: [
      {
        q: `Can I trek ${name} solo?`,
        a: trek.restricted
          ? `${name} is a restricted area, so a licensed guide must go with you. Since 2026 a single trekker can get the restricted-area permit through a registered agency, but going with a partner splits the guide's cost.`
          : `Yes. A guide is not mandatory on ${name} in 2026. ${quiet ? 'It is a quiet trail, so we recommend going with a partner or a local guide.' : 'A partner or a local guide still makes it safer and cheaper.'}`,
      },
      {
        q: `Do I need a guide for ${name}?`,
        a: trek.restricted
          ? `Yes. ${name} is in a restricted area: the special permit has to be arranged through a registered trekking agency and a licensed guide must walk with you.`
          : `No, a licensed guide is not mandatory on ${name} in 2026 and TIMS is not required. You still need the entry permit for any conservation area or national park on the route. We recommend a local guide anyway.`,
      },
      {
        q: `When is the best time to trek ${name}?`,
        a: `The usual seasons for ${name} are ${trek.season}. That is also when most trekkers go, so it is the easiest time to find a partner.`,
      },
      {
        q: `How do I find a trekking partner for ${name}?`,
        a: `Post your dates for free on Trekking Partners Nepal, browse other trekkers' ${name} posts, or ask in the Community.${quiet ? ' Few people walk this trail, so post a month or more ahead.' : ''}`,
      },
    ],
  };
}

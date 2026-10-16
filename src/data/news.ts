// News & updates categories. Each one gets its own page at /news/topic/<slug>/.
// To add a category, add it here – the article schema picks it up automatically.

export const categories = [
  {
    slug: 'route-updates',
    name: 'Route updates',
    short: 'Trail conditions, landslides, road works and closures',
    intro: 'Current trail conditions on Nepal’s trekking routes: landslides, washed-out bridges, new roads, snow on the passes and reopened trails. Check here before you set off.',
  },
  {
    slug: 'trek-news',
    name: 'Trek news',
    short: 'New routes, lodges and changes on popular treks',
    intro: 'What’s new on the trails: newly opened routes, community lodges and homestays, changes to classic itineraries and treks worth looking at this season.',
  },
  {
    slug: 'permits-rules',
    name: 'Permits & rules',
    short: 'Guide rules, permit fees and entry requirements',
    intro: 'Changes to trekking permits, fees, the licensed-guide rule and restricted-area requirements in Nepal, explained in plain language for independent trekkers.',
  },
  {
    slug: 'tourism-news',
    name: 'Tourism news',
    short: 'Flights, visas, festivals and travel in Nepal',
    intro: 'Nepal travel and tourism news that affects trekkers: flights to Lukla and Pokhara, visas, festivals, strikes, weather and season reports.',
  },
] as const;

export type CategorySlug = (typeof categories)[number]['slug'];
export const categorySlugs = categories.map((c) => c.slug) as [CategorySlug, ...CategorySlug[]];
export const getCategory = (slug: string) => categories.find((c) => c.slug === slug)!;

export const trailStatusLabel = {
  open: { label: 'Open', text: 'The trail is open as normal.' },
  caution: { label: 'Open with caution', text: 'Passable, but expect delays or detours.' },
  closed: { label: 'Closed', text: 'Not passable right now. Plan an alternative.' },
} as const;

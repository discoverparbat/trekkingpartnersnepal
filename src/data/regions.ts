// The six trekking regions. Images live in /public/images/.
// "card" is used on the home page, "hero" on the region page.

export interface Region {
  slug: string;        // URL: /<slug>/
  name: string;
  short: string;       // one line for cards
  intro: string;       // paragraph for the region page
  card: string;
  hero: string;
}

export const regions: Region[] = [
  {
    slug: 'annapurna-region',
    name: 'Annapurna',
    short: 'Nepal’s most popular trekking area, from short ridge walks to high passes.',
    intro:
      'The Annapurna region has something for every trekker: short hill walks above Pokhara with mountain sunrises, the classic Annapurna Base Camp and Circuit, and remote restricted valleys like Upper Mustang and Nar Phu. Teahouses are plentiful on the main trails, which makes it an easy place to start trekking with a new partner.',
    card: '/images/annapurna.jpg',
    hero: '/images/annapurna1.jpg',
  },
  {
    slug: 'everest-region',
    name: 'Everest',
    short: 'Sherpa villages, high lakes and the walk to the foot of the world’s highest peak.',
    intro:
      'The Khumbu is home to Everest Base Camp, the turquoise Gokyo Lakes and the demanding Three Passes route. Most treks start with a flight to Lukla and follow well-built teahouse trails through Sherpa villages and monasteries. Altitude is the main challenge here, so plan acclimatisation days with your partner.',
    card: '/images/everest.jpg',
    hero: '/images/everest1.jpg',
  },
  {
    slug: 'manaslu-region',
    name: 'Manaslu',
    short: 'A quieter circuit around the world’s eighth-highest mountain.',
    intro:
      'The Manaslu Circuit circles the world’s eighth-highest mountain and crosses the Larkya La, with fewer crowds than Annapurna. Tsum Valley is a hidden Buddhist valley branching off the same trail. Both are restricted areas, so you need a licensed guide and at least two trekkers to get the permit – a good reason to find a partner.',
    card: '/images/manaslu.jpg',
    hero: '/images/manaslu1.webp',
  },
  {
    slug: 'langtang-region',
    name: 'Langtang',
    short: 'Close to Kathmandu, with glaciers, holy lakes and Tamang villages.',
    intro:
      'Langtang is the closest major trekking region to Kathmandu – a day’s drive gets you to the trailhead. Walk up the Langtang Valley to Kyanjin Gompa, climb to the sacred Gosaikunda lakes, explore Tamang culture, or take the gentler Helambu trail. It suits trekkers with limited time.',
    card: '/images/langtang.jpg',
    hero: '/images/langtang1.jpg',
  },
  {
    slug: 'eastern-nepal',
    name: 'Eastern Nepal',
    short: 'Remote, wild treks to the base of Kanchenjunga.',
    intro:
      'Eastern Nepal is for trekkers who want long, remote routes with very few other people. The Kanchenjunga Base Camp trek reaches the foot of the world’s third-highest mountain through forests, rhododendron hills and Limbu and Sherpa villages. It is a restricted area that needs a guide and at least two trekkers.',
    card: '/images/easternnepal.webp',
    hero: '/images/easternnepal1.jpg',
  },
  {
    slug: 'western-nepal',
    name: 'Western Nepal',
    short: 'Nepal’s least-visited side: Rara, Dolpo, Dhaulagiri and the far west.',
    intro:
      'Western Nepal sees only a small share of the country’s trekkers. Here you will find Rara, Nepal’s largest lake, the deep blue Shey Phoksundo, the high trans-Himalayan landscapes of Upper Dolpo and Limi Valley, the tough Dhaulagiri Circuit and the far-western Api Himal. Many routes need camping or basic lodges, so a trekking partner makes logistics and costs much easier.',
    card: '/images/westernnepal.jpg',
    hero: '/images/westernnepal1.jpg',
  },
];

export const getRegion = (slug: string) => regions.find((r) => r.slug === slug);

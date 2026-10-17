// The trekking regions. Images live in /public/images/.
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
      'The Annapurna region has something for every trekker: short hill walks above Pokhara like Panchase and Khumai Danda, quiet ridges such as Kori and Mohare, the classic Annapurna Base Camp and Circuit, and remote restricted valleys like Upper Mustang and Nar Phu. Teahouses are plentiful on the main trails, which makes it an easy place to start trekking with a new partner.',
    card: '/images/annapurna.jpg',
    hero: '/images/annapurna1.jpg',
  },
  {
    slug: 'everest-region',
    name: 'Everest',
    short: 'Sherpa villages, high lakes and the walk to the foot of the world’s highest peak.',
    intro:
      'The Khumbu is home to Everest Base Camp, the turquoise Gokyo Lakes and the demanding Three Passes route. Most treks start with a flight to Lukla and follow well-built teahouse trails through Sherpa villages and monasteries; shorter options include the Everest View trek to Namche and the Pikey Peak trek in the lower Solu hills. Altitude is the main challenge here, so plan acclimatisation days with your partner.',
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
    slug: 'dhaulagiri-region',
    name: 'Dhaulagiri',
    short: 'The Dhaulagiri Circuit, Dhorpatan and the Magar hill country of Rukum and Rolpa.',
    intro:
      'West of the Kali Gandaki, the Dhaulagiri region is wild and lightly trekked. The Dhaulagiri Circuit crosses French Pass and Hidden Valley around the world’s seventh-highest mountain, Dhorpatan is Nepal’s only hunting reserve, with the Jaljala ridge and the high pastures of Bukipatan and Tikadhara, and the hills of Rukum and Rolpa offer Kham Magar villages, homestays, Sisne Himal, Sun Pokhari and the Guerrilla Trek. Facilities are basic and often camping-based, so finding a partner helps a lot.',
    card: '/images/dhaulagiri.jpg',
    hero: '/images/dhaulagiri.jpg',
  },
  {
    slug: 'langtang-region',      // URL kept as /langtang-region/ so existing links and rankings stay
    name: 'Langtang & Central',
    short: 'Close to Kathmandu: glaciers, holy lakes, Tamang villages and short hill walks.',
    intro:
      'Langtang and central Nepal are the closest trekking areas to Kathmandu – a few hours’ drive gets you to the trailhead. Walk up the Langtang Valley to Kyanjin Gompa, climb to the sacred lakes of Gosaikunda or Panch Pokhari, explore Tamang and Hyolmo culture on the Tamang Heritage Trail, Helambu and Ama Yangri, or take a short Nagarkot–Chisapani walk on the rim of the Kathmandu Valley. A good choice for trekkers with limited time.',
    card: '/images/langtang.jpg',
    hero: '/images/langtang1.jpg',
  },
  {
    slug: 'eastern-nepal',
    name: 'Eastern Nepal',
    short: 'Remote, wild treks to Kanchenjunga, Makalu and hidden mountain lakes.',
    intro:
      'Eastern Nepal is for trekkers who want long, remote routes with very few other people. The Kanchenjunga Base Camp trek reaches the foot of the world’s third-highest mountain, the Makalu Base Camp trek follows the Barun valley to the fifth-highest, and Timbung Pokhari is a high, sacred lake on the Taplejung–Panchthar border. Many routes are restricted or have only basic lodges, so trekking with a partner makes logistics and costs much easier.',
    card: '/images/easternnepal.webp',
    hero: '/images/easternnepal1.jpg',
  },
  {
    slug: 'western-nepal',
    name: 'Western Nepal',
    short: 'Nepal’s least-visited side: Rara, Dolpo, Humla and the far west.',
    intro:
      'Western Nepal sees only a small share of the country’s trekkers. Here you will find Rara, Nepal’s largest lake, the deep blue Shey Phoksundo, the high trans-Himalayan landscapes of Upper Dolpo and Limi Valley, and the far-western mountains of Api and Saipal. The pilgrim trail to Badimalika and the lakes and meadows of Ramaroshan show a side of Nepal few visitors see. Many routes need camping or basic lodges, so a trekking partner makes logistics and costs much easier.',
    card: '/images/westernnepal.jpg',
    hero: '/images/westernnepal1.jpg',
  },
];

export const getRegion = (slug: string) => regions.find((r) => r.slug === slug);

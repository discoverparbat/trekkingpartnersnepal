// All treks. Add a trek here and its page is built automatically at
// /<region-slug>/<trek-slug>/.
// Days and altitudes are typical ranges – check them before publishing.

export type Difficulty = 'Easy' | 'Moderate' | 'Challenging' | 'Strenuous';

export interface Trek {
  slug: string;
  region: string;          // must match a slug in regions.ts
  name: string;
  days: string;            // typical trekking days
  maxAltitude: string;     // highest point
  difficulty: Difficulty;
  season: string;
  restricted?: boolean;    // restricted-area permit: guide + min. 2 trekkers
  summary: string;
  image?: string;          // optional; falls back to the region image
}

export const treks: Trek[] = [
  // ── Annapurna ─────────────────────────────────────────────
  { slug: 'annapurna-base-camp', region: 'annapurna-region', name: 'Annapurna Base Camp', days: '7–12', maxAltitude: '4,130 m', difficulty: 'Moderate', season: 'Mar–May, Oct–Nov',
    summary: 'Walk through Gurung villages and bamboo forest into the Annapurna Sanctuary, a natural amphitheatre ringed by Annapurna I, Machapuchare and Hiunchuli.' },
  { slug: 'annapurna-circuit', region: 'annapurna-region', name: 'Annapurna Circuit', days: '12–18', maxAltitude: '5,416 m (Thorong La)', difficulty: 'Challenging', season: 'Mar–May, Oct–Nov',
    summary: 'The classic loop around the Annapurna massif, from subtropical valleys through Manang to the Thorong La pass and down to Muktinath.' },
  { slug: 'poon-hill', region: 'annapurna-region', name: 'Ghorepani Poon Hill', days: '4–5', maxAltitude: '3,210 m', difficulty: 'Easy', season: 'Oct–May',
    summary: 'A short trek through rhododendron forest to the famous Poon Hill sunrise over Dhaulagiri and Annapurna. Great for first-timers.' },
  { slug: 'mardi-himal', region: 'annapurna-region', name: 'Mardi Himal', days: '5–7', maxAltitude: '4,500 m', difficulty: 'Moderate', season: 'Mar–May, Oct–Nov',
    summary: 'A ridge trail climbing above the forest to close-up views of Machapuchare (Fishtail) and Mardi Himal.' },
  { slug: 'khopra-danda', region: 'annapurna-region', name: 'Khopra Danda', days: '6–8', maxAltitude: '3,660 m', difficulty: 'Moderate', season: 'Mar–May, Oct–Dec',
    summary: 'A quieter ridge with community lodges and a wide panorama of Dhaulagiri and Annapurna South, with an optional side trip to Khayer Lake.' },
  { slug: 'mohare-danda', region: 'annapurna-region', name: 'Mohare Danda', days: '4–6', maxAltitude: '3,300 m', difficulty: 'Easy', season: 'Oct–May',
    summary: 'A community eco-trek on a forested ridge with Dhaulagiri and Annapurna views, far quieter than nearby Poon Hill.' },
  { slug: 'kokhe-danda', region: 'annapurna-region', name: 'Kokhe Danda', days: '3–5', maxAltitude: 'TBC', difficulty: 'Easy', season: 'Oct–May',
    summary: 'A short, uncrowded trek in Parbat district with close views of Dhaulagiri and the Annapurna range.' },
  { slug: 'nar-phu-valley', region: 'annapurna-region', name: 'Nar Phu Valley', days: '10–14', maxAltitude: '5,320 m (Kang La)', difficulty: 'Challenging', season: 'Mar–May, Sep–Nov', restricted: true,
    summary: 'Hidden Tibetan-style villages, canyons and old monasteries in a restricted valley off the Annapurna Circuit, crossing the high Kang La.' },
  { slug: 'upper-mustang', region: 'annapurna-region', name: 'Upper Mustang', days: '12–17', maxAltitude: '3,840 m (Lo Manthang)', difficulty: 'Moderate', season: 'Mar–Nov', restricted: true,
    summary: 'The former Kingdom of Lo: red cliffs, cave dwellings and the walled city of Lo Manthang in a dry rain-shadow landscape that can be trekked even in monsoon.' },

  // ── Everest ───────────────────────────────────────────────
  { slug: 'everest-base-camp', region: 'everest-region', name: 'Everest Base Camp', days: '12–14', maxAltitude: '5,545 m (Kala Patthar)', difficulty: 'Challenging', season: 'Mar–May, Oct–Nov',
    summary: 'Fly to Lukla and follow the Khumbu valley through Namche Bazaar and Tengboche to Everest Base Camp and the Kala Patthar viewpoint.' },
  { slug: 'gokyo-lakes', region: 'everest-region', name: 'Gokyo Lakes', days: '11–13', maxAltitude: '5,357 m (Gokyo Ri)', difficulty: 'Challenging', season: 'Mar–May, Oct–Nov',
    summary: 'A quieter alternative to EBC: turquoise glacial lakes, the Ngozumpa glacier and the view of four 8,000 m peaks from Gokyo Ri.' },
  { slug: 'three-passes', region: 'everest-region', name: 'Everest Three Passes', days: '18–21', maxAltitude: '5,535 m (Kongma La)', difficulty: 'Strenuous', season: 'Apr–May, Oct–Nov',
    summary: 'The full Khumbu loop over Kongma La, Cho La and Renjo La, linking Everest Base Camp and Gokyo. For fit, acclimatised trekkers.' },
  { slug: 'makalu-base-camp', region: 'everest-region', name: 'Makalu Base Camp', days: '16–20', maxAltitude: '4,870 m', difficulty: 'Challenging', season: 'Apr–May, Oct–Nov',
    summary: 'A remote trek through the Makalu-Barun valley to the base of the world’s fifth-highest mountain, with basic lodges and very few trekkers.' },

  // ── Manaslu ───────────────────────────────────────────────
  { slug: 'manaslu-circuit', region: 'manaslu-region', name: 'Manaslu Circuit', days: '14–18', maxAltitude: '5,106 m (Larkya La)', difficulty: 'Challenging', season: 'Mar–May, Sep–Nov', restricted: true,
    summary: 'Circle Mt Manaslu from the Budhi Gandaki gorge through Tibetan Buddhist villages and over the Larkya La to join the Annapurna side.' },
  { slug: 'tsum-valley', region: 'manaslu-region', name: 'Tsum Valley', days: '12–16', maxAltitude: '3,700 m (Mu Gompa)', difficulty: 'Moderate', season: 'Mar–May, Sep–Nov', restricted: true,
    summary: 'A sacred, hidden valley near the Tibetan border with ancient gompas, mani walls and traditional villages.' },

  // ── Langtang ──────────────────────────────────────────────
  { slug: 'langtang-valley', region: 'langtang-region', name: 'Langtang Valley', days: '7–10', maxAltitude: '4,773 m (Kyanjin Ri)', difficulty: 'Moderate', season: 'Mar–May, Oct–Nov',
    summary: 'From Syabrubesi up the Langtang Valley to Kyanjin Gompa, with yak pastures, glaciers and viewpoints over Langtang Lirung.' },
  { slug: 'gosaikunda', region: 'langtang-region', name: 'Gosaikunda Lakes', days: '5–8', maxAltitude: '4,380 m', difficulty: 'Moderate', season: 'Mar–May, Oct–Nov',
    summary: 'A pilgrimage trail to the holy alpine lakes of Gosaikunda, often combined with Langtang Valley or Helambu.' },
  { slug: 'tamang-heritage-trail', region: 'langtang-region', name: 'Tamang Heritage Trail', days: '6–8', maxAltitude: '3,165 m', difficulty: 'Easy', season: 'Oct–May',
    summary: 'A cultural trek through Tamang villages, homestays and hot springs near the Tibetan border.' },
  { slug: 'helambu', region: 'langtang-region', name: 'Helambu', days: '5–8', maxAltitude: '3,640 m', difficulty: 'Easy', season: 'Oct–May',
    summary: 'A gentle trek north of Kathmandu through Hyolmo villages, monasteries and forest, reachable without a long drive.' },

  // ── Eastern Nepal ─────────────────────────────────────────
  { slug: 'kanchenjunga-base-camp', region: 'eastern-nepal', name: 'Kanchenjunga Base Camp', days: '20–24', maxAltitude: '5,143 m (Pangpema)', difficulty: 'Strenuous', season: 'Apr–May, Oct–Nov', restricted: true,
    summary: 'A long, remote trek to the north and south base camps of Kanchenjunga, the world’s third-highest mountain.' },

  // ── Western Nepal ─────────────────────────────────────────
  { slug: 'rara-lake', region: 'western-nepal', name: 'Rara Lake', days: '7–10', maxAltitude: '3,710 m (Murma Top)', difficulty: 'Moderate', season: 'Apr–Jun, Sep–Nov',
    summary: 'Trek through pine forest in Rara National Park to Nepal’s largest lake, with a sunrise climb to Murma Top.' },
  { slug: 'shey-phoksundo', region: 'western-nepal', name: 'Shey Phoksundo', days: '8–12', maxAltitude: '3,611 m (Phoksundo Lake)', difficulty: 'Moderate', season: 'May–Oct',
    summary: 'Lower Dolpo’s deep blue Phoksundo Lake, Nepal’s tallest waterfall and Bon-Po villages in Shey Phoksundo National Park.' },
  { slug: 'upper-dolpo', region: 'western-nepal', name: 'Upper Dolpo', days: '22–28', maxAltitude: '5,360 m (Kang La)', difficulty: 'Strenuous', season: 'May–Oct', restricted: true,
    summary: 'A camping expedition into the trans-Himalaya to Shey Gompa and remote Dolpo villages, crossing several high passes.' },
  { slug: 'limi-valley', region: 'western-nepal', name: 'Limi Valley', days: '16–20', maxAltitude: '4,949 m (Nyalu La)', difficulty: 'Strenuous', season: 'May–Oct', restricted: true,
    summary: 'A far-west route in Humla along old trade trails to Tibetan villages and views toward Mt Kailash.' },
  { slug: 'dhaulagiri-circuit', region: 'western-nepal', name: 'Dhaulagiri Circuit', days: '15–18', maxAltitude: '5,360 m (French Pass)', difficulty: 'Strenuous', season: 'Apr–May, Oct–Nov',
    summary: 'A tough camping trek around Dhaulagiri over French Pass and Dhampus Pass, through the Hidden Valley and down to the Kali Gandaki.' },
  { slug: 'api-himal-base-camp', region: 'western-nepal', name: 'Api Himal Base Camp', days: '12–16', maxAltitude: 'approx. 4,000 m', difficulty: 'Challenging', season: 'Apr–May, Oct–Nov',
    summary: 'Nepal’s far-western corner in Darchula, following the Mahakali river to the base of Api Himal in the Api Nampa Conservation Area.' },
];

export const treksInRegion = (region: string) => treks.filter((t) => t.region === region);
export const getTrek = (slug: string) => treks.find((t) => t.slug === slug);

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
  operatorPage?: string;   // optional; this trek's page on discoverparbat.com (itinerary, cost, booking)
}

export const treks: Trek[] = [
  // ── Annapurna ─────────────────────────────────────────────
  { slug: 'annapurna-base-camp', operatorPage: 'https://discoverparbat.com/annapurna-base-camp-trek', region: 'annapurna-region', name: 'Annapurna Base Camp', days: '7–12', maxAltitude: '4,130 m', difficulty: 'Moderate', season: 'Mar–May, Oct–Nov',
    summary: 'Walk through Gurung villages and bamboo forest into the Annapurna Sanctuary, a natural amphitheatre ringed by Annapurna I, Machapuchare and Hiunchuli.' },
  { slug: 'annapurna-circuit', operatorPage: 'https://discoverparbat.com/annapurna-circuit-trek', region: 'annapurna-region', name: 'Annapurna Circuit', days: '12–18', maxAltitude: '5,416 m (Thorong La)', difficulty: 'Challenging', season: 'Mar–May, Oct–Nov',
    summary: 'The classic loop around the Annapurna massif, from subtropical valleys through Manang to the Thorong La pass and down to Muktinath.' },
  { slug: 'poon-hill', operatorPage: 'https://discoverparbat.com/poonhill-trek', region: 'annapurna-region', name: 'Ghorepani Poon Hill', days: '4–5', maxAltitude: '3,210 m', difficulty: 'Easy', season: 'Oct–May',
    summary: 'A short trek through rhododendron forest to the famous Poon Hill sunrise over Dhaulagiri and Annapurna. Great for first-timers.' },
  { slug: 'mardi-himal', operatorPage: 'https://discoverparbat.com/mardi-himal-trek', region: 'annapurna-region', name: 'Mardi Himal', days: '5–7', maxAltitude: '4,500 m', difficulty: 'Moderate', season: 'Mar–May, Oct–Nov',
    summary: 'A ridge trail climbing above the forest to close-up views of Machapuchare (Fishtail) and Mardi Himal.' },
  { slug: 'khopra-danda', operatorPage: 'https://discoverparbat.com/khopra-ridge-trek', region: 'annapurna-region', name: 'Khopra Danda', days: '6–8', maxAltitude: '3,660 m', difficulty: 'Moderate', season: 'Mar–May, Oct–Dec',
    summary: 'A quieter ridge with community lodges and a wide panorama of Dhaulagiri and Annapurna South, with an optional side trip to Khayer Lake.' },
  { slug: 'mohare-danda', region: 'annapurna-region', name: 'Mohare Danda', days: '4–6', maxAltitude: '3,300 m', difficulty: 'Easy', season: 'Oct–May',
    summary: 'A community eco-trek on a forested ridge with Dhaulagiri and Annapurna views, far quieter than nearby Poon Hill.' },
  { slug: 'kokhe-danda', operatorPage: 'https://discoverparbat.com/kokhe-danda-trek', region: 'annapurna-region', name: 'Kokhe Danda', days: '3–5', maxAltitude: '3,309 m', difficulty: 'Easy', season: 'Oct–May',
    summary: 'A short, uncrowded trek in Parbat district with close views of Dhaulagiri and the Annapurna range.' },
  { slug: 'nar-phu-valley', region: 'annapurna-region', name: 'Nar Phu Valley', days: '10–14', maxAltitude: '5,320 m (Kang La)', difficulty: 'Challenging', season: 'Mar–May, Sep–Nov', restricted: true,
    summary: 'Hidden Tibetan-style villages, canyons and old monasteries in a restricted valley off the Annapurna Circuit, crossing the high Kang La.' },
  { slug: 'upper-mustang', region: 'annapurna-region', name: 'Upper Mustang', days: '12–17', maxAltitude: '3,840 m (Lo Manthang)', difficulty: 'Moderate', season: 'Mar–Nov', restricted: true,
    summary: 'The former Kingdom of Lo: red cliffs, cave dwellings and the walled city of Lo Manthang in a dry rain-shadow landscape that can be trekked even in monsoon.' },
  { slug: 'annapurna-north-base-camp', region: 'annapurna-region', name: 'Annapurna I Base Camp (North)', days: '7–9', maxAltitude: '4,190 m', difficulty: 'Challenging', season: 'Mar–May, Sep–Nov',
    summary: 'A remote route from Narchyang in Myagdi to the north base camp of Annapurna I, the side of the mountain first climbed in 1950. Lodges end at Narchyang, so the upper nights are camping.' },
  { slug: 'khumai-korchon', region: 'annapurna-region', name: 'Khumai Danda & Korchon', days: '3–5', maxAltitude: 'approx. 3,700 m (Korchon)', difficulty: 'Moderate', season: 'Oct–May',
    summary: 'A short ridge trek from Ghachok near Pokhara up through forest to Khumai Danda and the Korchon viewpoint, face to face with Machapuchare, returning via Mirsa and the Kharpani hot spring.' },
  { slug: 'kori-kapuche-karpu', region: 'annapurna-region', name: 'Kori, Kapuche & Karpu', days: '4–7', maxAltitude: 'approx. 3,800 m (Kori)', difficulty: 'Moderate', season: 'Mar–May, Oct–Nov',
    summary: 'Treks from the Gurung village of Sikles to Kapuche glacier lake below the Annapurnas and up to the high grassy ridges of Kori and Karpu Danda. Homestays in Sikles, camping higher up.' },
  { slug: 'panchase', region: 'annapurna-region', name: 'Panchase', days: '3–4', maxAltitude: 'approx. 2,500 m', difficulty: 'Easy', season: 'Oct–May',
    summary: 'A short forest and village walk on the Kaski–Parbat–Syangja border to Panchase’s sacred ponds and a sunrise view over Dhaulagiri, Annapurna and Machapuchare. Easy to reach from Pokhara.' },

  // ── Everest ───────────────────────────────────────────────
  { slug: 'everest-base-camp', region: 'everest-region', name: 'Everest Base Camp', days: '12–14', maxAltitude: '5,545 m (Kala Patthar)', difficulty: 'Challenging', season: 'Mar–May, Oct–Nov',
    summary: 'Fly to Lukla and follow the Khumbu valley through Namche Bazaar and Tengboche to Everest Base Camp and the Kala Patthar viewpoint.' },
  { slug: 'gokyo-lakes', region: 'everest-region', name: 'Gokyo Lakes', days: '11–13', maxAltitude: '5,357 m (Gokyo Ri)', difficulty: 'Challenging', season: 'Mar–May, Oct–Nov',
    summary: 'A quieter alternative to EBC: turquoise glacial lakes, the Ngozumpa glacier and the view of four 8,000 m peaks from Gokyo Ri.' },
  { slug: 'three-passes', region: 'everest-region', name: 'Everest Three Passes', days: '18–21', maxAltitude: '5,535 m (Kongma La)', difficulty: 'Strenuous', season: 'Apr–May, Oct–Nov',
    summary: 'The full Khumbu loop over Kongma La, Cho La and Renjo La, linking Everest Base Camp and Gokyo. For fit, acclimatised trekkers.' },
  { slug: 'everest-view-trek', region: 'everest-region', name: 'Everest View', days: '5–7', maxAltitude: '3,880 m (Hotel Everest View)', difficulty: 'Easy', season: 'Mar–May, Oct–Dec',
    summary: 'The short taste of the Khumbu: fly to Lukla, walk via Phakding to Namche Bazaar and climb to Hotel Everest View for a close look at Everest, Lhotse and Ama Dablam, then return the same way.' },
  { slug: 'pikey-peak', region: 'everest-region', name: 'Pikey Peak', days: '5–7', maxAltitude: '4,065 m', difficulty: 'Moderate', season: 'Oct–May',
    summary: 'A lower Solu trek from Dhap through Sherpa villages and rhododendron forest to Pikey Peak, with a sunrise panorama from Everest to Makalu – no Lukla flight needed. Ends in Junbesi or Phaplu.' },

  // ── Manaslu ───────────────────────────────────────────────
  { slug: 'manaslu-circuit', region: 'manaslu-region', name: 'Manaslu Circuit', days: '14–18', maxAltitude: '5,106 m (Larkya La)', difficulty: 'Challenging', season: 'Mar–May, Sep–Nov', restricted: true,
    summary: 'Circle Mt Manaslu from the Budhi Gandaki gorge through Tibetan Buddhist villages and over the Larkya La to join the Annapurna side.' },
  { slug: 'tsum-valley', region: 'manaslu-region', name: 'Tsum Valley', days: '12–16', maxAltitude: '3,700 m (Mu Gompa)', difficulty: 'Moderate', season: 'Mar–May, Sep–Nov', restricted: true,
    summary: 'A sacred, hidden valley near the Tibetan border with ancient gompas, mani walls and traditional villages.' },
  { slug: 'meme-pokhari', region: 'manaslu-region', name: 'Meme Pokhari', days: '6–8', maxAltitude: 'approx. 4,350 m', difficulty: 'Challenging', season: 'Mar–May, Sep–Nov',
    summary: 'A new trail in Dordi, Lamjung, from the village of Khinchok past Bahrapokhari to the sacred Meme Pokhari lakes. Homestays lower down; camping and herders’ shelters above Khinchok.' },

  // ── Langtang & Central ────────────────────────────────────
  { slug: 'langtang-valley', region: 'langtang-region', name: 'Langtang Valley', days: '7–10', maxAltitude: '4,773 m (Kyanjin Ri)', difficulty: 'Moderate', season: 'Mar–May, Oct–Nov',
    summary: 'From Syabrubesi up the Langtang Valley to Kyanjin Gompa, with yak pastures, glaciers and viewpoints over Langtang Lirung.' },
  { slug: 'gosaikunda', region: 'langtang-region', name: 'Gosaikunda Lakes', days: '5–8', maxAltitude: '4,380 m', difficulty: 'Moderate', season: 'Mar–May, Oct–Nov',
    summary: 'A pilgrimage trail to the holy alpine lakes of Gosaikunda, often combined with Langtang Valley or Helambu.' },
  { slug: 'tamang-heritage-trail', region: 'langtang-region', name: 'Tamang Heritage Trail', days: '6–8', maxAltitude: '3,165 m', difficulty: 'Easy', season: 'Oct–May',
    summary: 'A cultural trek through Tamang villages, homestays and hot springs near the Tibetan border.' },
  { slug: 'helambu', region: 'langtang-region', name: 'Helambu', days: '5–8', maxAltitude: '3,640 m', difficulty: 'Easy', season: 'Oct–May',
    summary: 'A gentle trek north of Kathmandu through Hyolmo villages, monasteries and forest, reachable without a long drive.' },
  { slug: 'panch-pokhari', region: 'langtang-region', name: 'Panch Pokhari', days: '5–8', maxAltitude: 'approx. 4,100 m', difficulty: 'Moderate', season: 'Mar–May, Oct–Nov',
    summary: 'A trek in Sindhupalchok to five sacred high lakes below Jugal Himal, a Hindu and Buddhist pilgrimage site, through Tamang and Sherpa villages with basic teahouses.' },
  { slug: 'ama-yangri', region: 'langtang-region', name: 'Ama Yangri', days: '3–5', maxAltitude: '3,771 m', difficulty: 'Moderate', season: 'Oct–May',
    summary: 'A short Helambu trek via the Hyolmo village of Tarkeghyang to the prayer-flag summit of Ama Yangri, with views from Langtang to Jugal and Gaurishankar.' },
  { slug: 'nagarkot-chisapani', region: 'langtang-region', name: 'Nagarkot – Chisapani', days: '2–3', maxAltitude: 'approx. 2,200 m', difficulty: 'Easy', season: 'Sep–May',
    summary: 'A short hike on the rim of the Kathmandu Valley from Sundarijal through Shivapuri National Park to Chisapani and on to Nagarkot, with Himalayan sunrise views. Ideal for a first trek or a weekend.' },

  // ── Eastern Nepal ─────────────────────────────────────────
  { slug: 'kanchenjunga-base-camp', region: 'eastern-nepal', name: 'Kanchenjunga Base Camp', days: '20–24', maxAltitude: '5,143 m (Pangpema)', difficulty: 'Strenuous', season: 'Apr–May, Oct–Nov', restricted: true,
    summary: 'A long, remote trek to the north and south base camps of Kanchenjunga, the world’s third-highest mountain.' },
  { slug: 'makalu-base-camp', region: 'eastern-nepal', name: 'Makalu Base Camp', days: '16–20', maxAltitude: '4,870 m', difficulty: 'Challenging', season: 'Apr–May, Oct–Nov',
    summary: 'A remote trek through the Makalu-Barun valley to the base of the world’s fifth-highest mountain, with basic lodges and very few trekkers.' },
  { slug: 'timbung-pokhari', region: 'eastern-nepal', name: 'Timbung Pokhari', days: '5–7', maxAltitude: 'approx. 4,335 m', difficulty: 'Moderate', season: 'Mar–May, Sep–Nov',
    summary: 'A high, sacred lake on the Taplejung–Panchthar border, reached in about two days on foot from Chyangthapu through Limbu villages and rhododendron forest. Facilities are very basic.' },

  // ── Western Nepal ─────────────────────────────────────────
  { slug: 'rara-lake', region: 'western-nepal', name: 'Rara Lake', days: '7–10', maxAltitude: '3,710 m (Murma Top)', difficulty: 'Moderate', season: 'Apr–Jun, Sep–Nov',
    summary: 'Trek through pine forest in Rara National Park to Nepal’s largest lake, with a sunrise climb to Murma Top.' },
  { slug: 'shey-phoksundo', region: 'western-nepal', name: 'Shey Phoksundo', days: '8–12', maxAltitude: '3,611 m (Phoksundo Lake)', difficulty: 'Moderate', season: 'May–Oct',
    summary: 'Lower Dolpo’s deep blue Phoksundo Lake, Nepal’s tallest waterfall and Bon-Po villages in Shey Phoksundo National Park.' },
  { slug: 'upper-dolpo', region: 'western-nepal', name: 'Upper Dolpo', days: '22–28', maxAltitude: '5,360 m (Kang La)', difficulty: 'Strenuous', season: 'May–Oct', restricted: true,
    summary: 'A camping expedition into the trans-Himalaya to Shey Gompa and remote Dolpo villages, crossing several high passes.' },
  { slug: 'limi-valley', region: 'western-nepal', name: 'Limi Valley', days: '16–20', maxAltitude: '4,949 m (Nyalu La)', difficulty: 'Strenuous', season: 'May–Oct', restricted: true,
    summary: 'A far-west route in Humla along old trade trails to Tibetan villages and views toward Mt Kailash.' },
  { slug: 'api-himal-base-camp', operatorPage: 'https://discoverparbat.com/api-himal-base-camp-trek', region: 'western-nepal', name: 'Api Himal Base Camp', days: '12–16', maxAltitude: 'approx. 4,000 m', difficulty: 'Challenging', season: 'Apr–May, Oct–Nov',
    summary: 'Nepal’s far-western corner in Darchula, following the Mahakali river to the base of Api Himal in the Api Nampa Conservation Area.' },
  { slug: 'saipal-base-camp', region: 'western-nepal', name: 'Saipal Base Camp', days: '15–18', maxAltitude: 'approx. 4,700 m', difficulty: 'Strenuous', season: 'Mar–May, Sep–Nov',
    summary: 'A long, mostly camping expedition from Simikot in Humla to the base of 7,031 m Saipal Himal, through some of Nepal’s most remote villages and high pastures.' },
  { slug: 'badimalika', region: 'western-nepal', name: 'Badimalika', days: '6–8', maxAltitude: '4,210 m', difficulty: 'Moderate', season: 'Apr–Oct',
    summary: 'A pilgrim trail from Martadi in Bajura over vast high meadows (patans) to the Badimalika temple, busiest at the Janai Purnima fair. Camping needed. Often combined with Ramaroshan.' },
  { slug: 'ramaroshan', region: 'western-nepal', name: 'Ramaroshan', days: '3–5', maxAltitude: 'approx. 3,200 m', difficulty: 'Easy', season: 'Mar–May, Sep–Nov',
    summary: 'The “12 lakes and 18 meadows” of Achham: forest, alpine lakes and grasslands with homestays and basic lodges, little known even within Nepal.' },

  // ── Dhaulagiri ────────────────────────────────────────────
  { slug: 'dhaulagiri-circuit', region: 'dhaulagiri-region', name: 'Dhaulagiri Circuit', days: '15–18', maxAltitude: '5,360 m (French Pass)', difficulty: 'Strenuous', season: 'Apr–May, Oct–Nov',
    summary: 'A tough camping trek around Dhaulagiri over French Pass and Dhampus Pass, through the Hidden Valley and down to the Kali Gandaki.' },
  { slug: 'dhorpatan', operatorPage: 'https://discoverparbat.com/dhorpatan-jaljala-circuit-trek', region: 'dhaulagiri-region', name: 'Dhorpatan', days: '10–14', maxAltitude: 'approx. 3,800 m', difficulty: 'Moderate', season: 'Mar–May, Sep–Nov',
    summary: 'Treks around Dhorpatan Hunting Reserve, Nepal’s only hunting reserve: the Jaljala side, the high pastures of Bukipatan and Tikadhara, with Dhaulagiri and Putha Hiunchuli views, blue sheep and Magar villages. Camping and homestays.' },
  { slug: 'rukum-rolpa', region: 'dhaulagiri-region', name: 'Rukum / Rolpa Treks', days: '5–14', maxAltitude: 'Varies by route', difficulty: 'Moderate', season: 'Mar–May, Sep–Nov',
    summary: 'Routes through the Kham Magar hills of Rukum and Rolpa: Sisne Himal, the Guerrilla Trek along trails tied to Nepal’s civil-war history, Sun Pokhari and the high pastures of Chungri Buki. Mostly homestays and camping.' },
];

export const treksInRegion = (region: string) => treks.filter((t) => t.region === region);
export const getTrek = (slug: string) => treks.find((t) => t.slug === slug);

/** "Poon Hill Trek", but "Rukum / Rolpa Treks" stays as it is (no "Treks Trek"). */
export const trekTitle = (t: { name: string }, word = 'Trek') =>
  /\btreks?$/i.test(t.name) ? t.name : `${t.name} ${word}`;

// Your fixed-departure guided treks, shown on the home page, trek pages and /fixed-departures/.
// Past departures are hidden automatically at build time.

export interface Departure {
  trek: string;        // trek slug from treks.ts
  start: string;       // YYYY-MM-DD
  days: number;        // total package days
  price?: string;      // e.g. 'US$ 650' – leave out to show "Ask for price"
  seatsLeft: number;
  groupMax: number;
}

export const departures: Departure[] = [
  { trek: 'khopra-danda', start: '2026-10-25', days: 9, seatsLeft: 12, groupMax: 12 },
  { trek: 'kokhe-danda',  start: '2026-10-28', days: 5, seatsLeft: 12, groupMax: 12 },
  { trek: 'kokhe-danda',  start: '2026-11-02', days: 5, seatsLeft: 12, groupMax: 12 },
];

export const upcomingDepartures = () => {
  const today = new Date().toISOString().slice(0, 10);
  return departures.filter((d) => d.start >= today).sort((a, b) => a.start.localeCompare(b.start));
};
// Fixed departures now live in Supabase (table: departures).
// Add, edit or remove them at /admin/ – no code changes needed.
import { supabase } from '../lib/supabase';

export interface Departure {
  id: string;
  trek: string;        // trek slug from treks.ts
  start: string;       // YYYY-MM-DD
  days: number;
  price?: string;
  seatsLeft: number;
  groupMax: number;
}

const COLUMNS = 'id, trek, start_date, days, price, group_max, seats_left';

export const fromRow = (r: any): Departure => ({
  id: r.id,
  trek: r.trek,
  start: r.start_date,
  days: r.days,
  price: r.price || undefined,
  seatsLeft: r.seats_left,
  groupMax: r.group_max,
});

const today = () => new Date().toISOString().slice(0, 10);

/** Upcoming published departures, soonest first. Works at build time and in the browser. */
export async function fetchUpcoming(): Promise<Departure[]> {
  const { data, error } = await supabase
    .from('departures')
    .select(COLUMNS)
    .eq('published', true)
    .gte('start_date', today())
    .order('start_date', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

// Build time: fetch once and share across all pages. If Supabase can't be
// reached the build still succeeds; the browser then loads fresh data anyway.
let cache: Promise<Departure[]> | undefined;
export function getDepartures(): Promise<Departure[]> {
  cache ??= fetchUpcoming().catch((e) => {
    console.warn('[departures] build-time fetch failed:', e.message);
    return [];
  });
  return cache;
}

// ── Single departure with its details (browser) ──
export interface DepartureDetail extends Departure {
  published: boolean;
  overview?: string;
  itinerary?: string;
  included?: string;
  notIncluded?: string;
  meetingPoint?: string;
}

export async function fetchDeparture(id: string): Promise<DepartureDetail | null> {
  const { data, error } = await supabase
    .from('departures')
    .select(`${COLUMNS}, published, overview, itinerary, included, not_included, meeting_point`)
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return {
    ...fromRow(data),
    published: data.published,
    overview: data.overview || undefined,
    itinerary: data.itinerary || undefined,
    included: data.included || undefined,
    notIncluded: data.not_included || undefined,
    meetingPoint: data.meeting_point || undefined,
  };
}

/** Departure page address */
export const departureUrl = (id: string) => `/departure/?id=${encodeURIComponent(id)}`;

// Which partner posts Google may index. Used by the Cloudflare functions for /post/ and
// /find-partners/sitemap.xml, so the page and the sitemap always agree.
//
// A post is worth finding in search only while it's live: open, its dates haven't passed,
// and at least one trekker has replied (a real conversation, not an empty one-liner).
// Everything else stays noindex so it doesn't thin out the site in Google's eyes.

/** Today's date in Nepal (UTC+5:45), YYYY-MM-DD */
export const nepalToday = () => new Date(Date.now() + 345 * 60_000).toISOString().slice(0, 10);

export const MIN_DESCRIPTION = 40;   // characters

export interface IndexCheck {
  status: string;
  start_date: string;
  end_date: string | null;
  description: string;
}

export function isIndexable(trip: IndexCheck, replies: number, today = nepalToday()) {
  const lastDay = trip.end_date || trip.start_date;
  return trip.status === 'open'
    && lastDay >= today
    && replies > 0
    && trip.description.trim().length >= MIN_DESCRIPTION;
}

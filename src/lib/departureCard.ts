// Builds a departure card in the browser – same markup as DepartureCard.astro.
import type { Departure } from '../data/departures';
import { getTrek } from '../data/treks';
import { getRegion } from '../data/regions';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = '') {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

export function departureCard(d: Departure): HTMLElement | null {
  const trek = getTrek(d.trek);
  const region = trek ? getRegion(trek.region) : undefined;
  if (!trek || !region) return null;

  const date = new Date(d.start + 'T00:00:00');
  const full = d.seatsLeft <= 0;
  const filled = Math.round(((d.groupMax - d.seatsLeft) / d.groupMax) * 100);

  const card = el('article', full ? 'dep full' : 'dep');

  const dateBox = el('div', 'dep-date');
  dateBox.append(
    el('span', 'dep-day', date.toLocaleDateString('en-GB', { day: '2-digit' })),
    el('span', 'dep-month', date.toLocaleDateString('en-GB', { month: 'short' })),
    el('span', 'dep-year', String(date.getFullYear())),
  );

  const main = el('div', 'dep-main');
  const h3 = el('h3');
  const link = el('a', '', trek.name);
  link.href = `/${region.slug}/${trek.slug}/`;
  h3.append(link);

  const meta = el('div', 'dep-meta', `${d.days} days · max ${trek.maxAltitude.split(' (')[0]} · `);
  meta.append(el('span', `badge badge-${trek.difficulty}`, trek.difficulty));

  const seats = el('div', 'dep-seats');
  const bar = el('div', 'bar');
  const fill = el('span');
  fill.style.width = `${full ? 100 : filled}%`;
  bar.append(fill);
  seats.append(
    bar,
    el('span', !full && d.seatsLeft <= 4 ? 'seats few' : 'seats', full ? 'Fully booked' : `${d.seatsLeft} of ${d.groupMax} seats left`),
  );

  const foot = el('div', 'dep-foot');
  const price = el('span', 'price');
  if (d.price) { price.append('From '); price.append(el('strong', '', d.price)); }
  else price.textContent = 'Ask for price';
  const btn = el('a', full ? 'btn btn-sm btn-outline' : 'btn btn-sm btn-sun', full ? 'Next date?' : 'Join');
  const subject = full ? `Next departure: ${trek.name}` : `Fixed departure: ${trek.name} – ${d.start}`;
  btn.href = `mailto:hello@trekkingpartnersnepal.com?subject=${encodeURIComponent(subject)}`;
  foot.append(price, btn);

  main.append(el('span', 'dep-region', region.name), h3, meta, seats, foot);
  card.append(dateBox, main);
  return card;
}

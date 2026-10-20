// Community (trek questions & answers): fixed lists used by the pages and the database.
// The values must match the checks in supabase/update-10-community.sql.

export const TOPICS = [
  { value: 'conditions', label: 'Trail conditions' },
  { value: 'gear', label: 'Gear' },
  { value: 'permits', label: 'Permits' },
  { value: 'teahouses', label: 'Teahouses' },
  { value: 'transport', label: 'Transport' },
  { value: 'other', label: 'Other' },
] as const;

export type Topic = (typeof TOPICS)[number]['value'];
export const topicLabel = (v: string) => TOPICS.find((t) => t.value === v)?.label ?? 'Other';

/** Questions that aren't about one trek (SIM cards, flights to Lukla, general gear…) */
export const GENERAL = 'general';
export const GENERAL_LABEL = 'General / any trek';

export const NOTE_KINDS = [
  { value: 'closure', label: 'Closure' },
  { value: 'trail', label: 'Trail' },
  { value: 'weather', label: 'Weather' },
  { value: 'site', label: 'Site news' },
] as const;

export const noteLabel = (v: string) => NOTE_KINDS.find((k) => k.value === v)?.label ?? v;

/** How long an admin note stays up (days). 0 = until you delete it. */
export const NOTE_EXPIRY = [
  { days: 3, label: '3 days' },
  { days: 7, label: '1 week' },
  { days: 14, label: '2 weeks' },
  { days: 30, label: '1 month' },
  { days: 0, label: 'Until I delete it' },
];

// Phrases that usually mean "I'm looking for trek partners" – those belong on Find partners.
// Used only to show a friendly prompt before publishing; the member can still continue.
const PARTNER_PATTERNS = [
  /\b(looking|searching|seeking)\s+for\s+(a\s+|some\s+)?(trek(king)?\s+|hiking\s+)?(partners?|buddy|buddies|companions?|people|someone|group)\b/i,
  /\b(need|want|find)\s+(a\s+)?(trek(king)?\s+|hiking\s+)?(partners?|buddy|buddies|companions?)\b/i,
  /\b(join|joining)\s+(me|us|our\s+(group|team|trek))\b/i,
  /\banyone\s+(want|wants|wanna|interested|keen|up\s+for)\b.*\b(join|trek|go|come)\b/i,
  /\b(share|split)\s+(a\s+|the\s+)?(guide|porter|jeep|costs?)\b/i,
  /\btrek(king)?\s+(partners?|buddy|buddies)\b/i,
];

export const looksLikePartnerRequest = (text: string) => PARTNER_PATTERNS.some((p) => p.test(text));

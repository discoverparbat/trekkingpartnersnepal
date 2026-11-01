// "Turn on messages" nudges for members who haven't set up private messages yet (browser only).
// Shown on Find partners, on the member's own posts and in My account, so most people are ready
// before someone tries to message them.
import { supabase } from './supabase';
import { getUser, getMyProfile, isComplete } from './auth';
import { el } from './posts';

const DISMISS_KEY = 'tpn-msg-nudge-dismissed';
const DISMISS_DAYS = 21;

/** True when the visitor is a signed-in member with a complete profile who hasn't turned on messages. */
export async function needsMessages(): Promise<boolean> {
  const user = await getUser();
  if (!user) return false;
  const [profile, key] = await Promise.all([
    getMyProfile(user.id),
    supabase.from('message_keys').select('user_id').eq('user_id', user.id).maybeSingle(),
  ]);
  return isComplete(profile) && !key.error && !key.data;
}

const dismissed = () => {
  try {
    const t = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return Date.now() - t < DISMISS_DAYS * 86400000;
  } catch { return false; }
};

export const setupUrl = () => `/messages/?next=${encodeURIComponent(location.pathname + location.search)}`;

/** A slim banner with a "Turn on" button. `dismissable` banners stay hidden for 3 weeks after ✕. */
export function nudgeBanner(text: string, dismissable = true): HTMLElement | null {
  if (dismissable && dismissed()) return null;
  const box = el('div', 'msg-nudge');
  box.append(el('span', 'msg-nudge-icon', '✉'), el('span', 'msg-nudge-text', text));
  const go = el('a', 'btn btn-sun btn-sm', 'Turn on messages');
  (go as HTMLAnchorElement).href = setupUrl();
  box.append(go);
  if (dismissable) {
    const x = el('button', 'msg-nudge-x', '✕');
    x.type = 'button';
    x.setAttribute('aria-label', 'Hide for now');
    x.addEventListener('click', () => {
      try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
      box.remove();
    });
    box.append(x);
  }
  return box;
}

/** Put the banner into `slot` if this member still needs to turn on messages. */
export async function mountNudge(slot: HTMLElement | null, text: string, dismissable = true) {
  if (!slot || !(await needsMessages())) return false;
  const b = nudgeBanner(text, dismissable);
  if (!b) return false;
  slot.replaceChildren(b);
  slot.hidden = false;
  return true;
}

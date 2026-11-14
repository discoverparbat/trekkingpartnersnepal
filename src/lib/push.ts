// Phone & computer notifications (Web Push, update 28). Browser only.
// A member turns them on per device; the device is saved with save_push_subscription() and the
// "push-send" Edge Function then shows every bell notification and private message on it.
import { supabase } from './supabase';

// Public half of the VAPID key pair (safe to publish). The private half is the VAPID_PRIVATE_KEY
// secret of the push-send Edge Function. Changing one means changing both.
export const VAPID_PUBLIC_KEY = 'BGuCdVwMthQqaS8TicEdNmzIyv96wsJdo50OujQHx2o3Gqx11WA3rOPylaRlAQENQkz-4RYK06Q_kVQoAVbp6-U';

export type PushState =
  | 'on'            // this device gets notifications
  | 'off'           // supported, not turned on yet
  | 'blocked'       // the member said "Block" – only the browser settings can undo it
  | 'ios-install'   // iPhone/iPad in Safari: must add the site to the Home Screen first
  | 'unsupported';

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () =>
  matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;

export function pushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function keyBytes(b64u: string) {
  const b64 = b64u.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64u.length + 3) % 4);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function registration() {
  const existing = await navigator.serviceWorker.getRegistration('/');
  const reg = existing ?? (await navigator.serviceWorker.register('/sw.js', { scope: '/' }));
  return navigator.serviceWorker.ready.then(() => reg);
}

export async function pushState(): Promise<PushState> {
  if (!pushSupported()) return isIOS() && !isStandalone() ? 'ios-install' : 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';
  if (Notification.permission !== 'granted') return isIOS() && !isStandalone() ? 'ios-install' : 'off';
  const reg = await navigator.serviceWorker.getRegistration('/');
  const sub = await reg?.pushManager.getSubscription();
  return sub ? 'on' : 'off';
}

async function save(sub: PushSubscription) {
  const j = sub.toJSON();
  const { error } = await supabase.rpc('save_push_subscription', {
    p_endpoint: sub.endpoint, p_p256dh: j.keys?.p256dh, p_auth: j.keys?.auth, p_user_agent: navigator.userAgent,
  });
  if (error) throw error;
}

/** Asks for permission (must be called from a tap/click) and saves this device. */
export async function enablePush(): Promise<PushState> {
  if (!pushSupported()) return pushState();
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission === 'denied' ? 'blocked' : 'off';
  const reg = await registration();
  let sub = await reg.pushManager.getSubscription();
  // Subscribed with an old key? Start again with the current one.
  const current = sub?.options?.applicationServerKey;
  if (sub && current && btoa(String.fromCharCode(...new Uint8Array(current))) !== btoa(String.fromCharCode(...keyBytes(VAPID_PUBLIC_KEY)))) {
    await sub.unsubscribe();
    sub = null;
  }
  sub ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) });
  await save(sub);
  return 'on';
}

/** Turns notifications off on this device only. */
export async function disablePush(): Promise<PushState> {
  if (!pushSupported()) return pushState();
  const reg = await navigator.serviceWorker.getRegistration('/');
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await supabase.rpc('remove_push_subscription', { p_endpoint: sub.endpoint });
    await sub.unsubscribe().catch(() => {});
  }
  return pushState();
}

/** On every page load for signed-in members: keep this device linked to whoever is signed in. */
export async function syncPush() {
  if (!pushSupported() || Notification.permission !== 'granted') return;
  try {
    const reg = await registration();
    let sub = await reg.pushManager.getSubscription();
    if (!sub) return;   // turned off on purpose – don't resubscribe
    await save(sub);
    navigator.serviceWorker.addEventListener('message', async (e) => {
      if (e.data?.type === 'tpn-push-resubscribe') {
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) });
        await save(sub);
      }
    });
  } catch {
    /* never break the page over notifications */
  }
}

/** Before signing out: stop this device getting the member's notifications. */
export async function forgetDevice() {
  try {
    if (!pushSupported()) return;
    const reg = await navigator.serviceWorker.getRegistration('/');
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await supabase.rpc('remove_push_subscription', { p_endpoint: sub.endpoint });
      await sub.unsubscribe().catch(() => {});
    }
  } catch {}
}

/** Clears the number on the home-screen icon (when the member looks at their notifications). */
export function clearAppBadge() {
  try { (navigator as any).clearAppBadge?.(); } catch {}
}

/** What to tell the member for each state. */
export function pushHelp(state: PushState): string {
  switch (state) {
    case 'on': return 'On for this device. Replies, answers, messages and site news pop up like app notifications.';
    case 'blocked': return 'Notifications are blocked for this site. Allow them in your browser’s site settings (tap the icon left of the address), then reload.';
    case 'ios-install': return 'On iPhone or iPad: tap Share → “Add to Home Screen”, open Trekking Partners Nepal from your Home Screen, then turn notifications on there.';
    case 'unsupported': return 'This browser can’t show notifications. Try Chrome, Edge, Firefox or Safari.';
    default: return 'Get replies, answers and messages on your lock screen, like app notifications – even when the site is closed.';
  }
}

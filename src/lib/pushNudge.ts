// "Get notified when they reply" card, shown right after a member posts a trek or sends a first
// message – the moment they actually want a notification (added 19 Nov 2026).
// Shows nothing if notifications are already on, blocked, unsupported, or dismissed in the last 14 days.
import { pushState, enablePush, pushHelp } from './push';
import { track } from './track';

const KEY = 'tpn-push-nudge-dismissed';
const DAYS = 14;

function dismissedRecently() {
  try { const t = Number(localStorage.getItem(KEY) || 0); return Date.now() - t < DAYS * 864e5; } catch { return false; }
}

export async function showPushNudge(after: Element, text: string, where: string) {
  if (document.getElementById('push-nudge') || dismissedRecently()) return;
  const state = await pushState();
  if (state !== 'off' && state !== 'ios-install') return;

  const card = document.createElement('div');
  card.id = 'push-nudge';
  card.setAttribute('role', 'status');
  card.style.cssText = 'margin:14px 0;padding:14px 16px;border:1px solid var(--sky-200,#c4e0fd);background:var(--sky-50,#f2f8ff);border-radius:14px;display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap';
  const icon = document.createElement('span'); icon.textContent = '🔔'; icon.style.fontSize = '1.3rem';
  const body = document.createElement('div'); body.style.cssText = 'flex:1;min-width:200px';
  const p = document.createElement('p'); p.style.margin = '0 0 8px'; p.innerHTML = `<strong>${text}</strong>`;
  const help = document.createElement('p'); help.style.cssText = 'margin:0 0 10px;font-size:.9rem;color:var(--muted,#55657d)';
  help.textContent = state === 'ios-install' ? pushHelp('ios-install') : 'Replies and messages pop up on this device like app notifications, even when the site is closed.';
  const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap';
  const close = document.createElement('button');
  close.type = 'button'; close.className = 'btn btn-sm'; close.textContent = 'Not now';
  close.addEventListener('click', () => { try { localStorage.setItem(KEY, String(Date.now())); } catch {} card.remove(); });
  if (state === 'off') {
    const on = document.createElement('button');
    on.type = 'button'; on.className = 'btn btn-sun btn-sm'; on.textContent = 'Turn on notifications';
    on.addEventListener('click', async () => {
      on.disabled = true;
      const s = await enablePush().catch(() => 'off' as const);
      if (s === 'on') {
        track('push_enabled', { where });
        body.replaceChildren(Object.assign(document.createElement('p'), { textContent: '✓ Notifications are on for this device.' }));
        setTimeout(() => card.remove(), 4000);
      } else {
        help.textContent = pushHelp(s);
        on.disabled = false;
      }
    });
    row.append(on);
  }
  row.append(close);
  body.append(p, help, row);
  card.append(icon, body);
  after.insertAdjacentElement('afterend', card);
}

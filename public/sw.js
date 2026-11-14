// Trekking Partners Nepal – service worker for phone & computer notifications (update 28).
// Only handles push notifications; it doesn't cache pages, so the site always loads fresh.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data ? event.data.text() : '' }; }
  const url = typeof data.url === 'string' && data.url.startsWith('/') && !data.url.startsWith('//') ? data.url : '/';
  event.waitUntil((async () => {
    await self.registration.showNotification(data.title || 'Trekking Partners Nepal', {
      body: data.body || '',
      icon: '/web-app-manifest-192x192.png',
      badge: '/notification-badge.png',
      tag: data.tag || undefined,
      renotify: !!data.tag,          // buzz again when a newer one replaces an older one
      data: { url },
    });
    // Number on the home-screen icon (where supported)
    try {
      const shown = await self.registration.getNotifications();
      if (self.navigator.setAppBadge) await self.navigator.setAppBadge(shown.length);
    } catch {}
    // Tell open tabs so the bell / envelope refresh straight away
    const tabs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    tabs.forEach((c) => c.postMessage({ type: 'tpn-push' }));
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil((async () => {
    try {
      const left = await self.registration.getNotifications();
      if (self.navigator.clearAppBadge && !left.length) await self.navigator.clearAppBadge();
      else if (self.navigator.setAppBadge) await self.navigator.setAppBadge(left.length);
    } catch {}
    const tabs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of tabs) {
      if (c.url === target && 'focus' in c) return c.focus();
    }
    const mine = tabs.find((c) => new URL(c.url).origin === self.location.origin);
    if (mine && 'navigate' in mine) {
      try { await mine.focus(); return await mine.navigate(target); } catch {}
    }
    return self.clients.openWindow(target);
  })());
});

// The browser renewed this device's push address: save the new one if we still can
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil((async () => {
    const tabs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    tabs.forEach((c) => c.postMessage({ type: 'tpn-push-resubscribe' }));
  })());
});

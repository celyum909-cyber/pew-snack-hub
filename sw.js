// Depew Snack Hub — service worker.
// 1. Lets phones install the site as an app.
// 2. Shows "Deal of the Day" phone alerts (push notifications) sent by the pew-deal Worker.
// It does NOT cache anything, so visitors always see the latest deal and prices.
const DEAL_API = 'https://pew-deal.celyum909.workers.dev';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

// ---- a deal alert arrives ----
self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { d = { body: event.data ? event.data.text() : '' }; }
  const options = {
    body: d.body || 'Tap to see today’s deal.',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: d.tag || 'deal',          // a new deal alert replaces the old one instead of piling up
    renotify: true,
    data: { url: d.url || './#deal' },
  };
  if (d.image) options.image = d.image; // big photo on Android / Windows
  event.waitUntil(self.registration.showNotification(d.title || 'Depew Snack Hub', options));
});

// ---- customer taps the alert: open (or focus) the app on the deal ----
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data && event.notification.data.url || './#deal', self.registration.scope).href;
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) {
      if (w.url.startsWith(self.registration.scope) && !w.url.includes('owner.html') && !w.url.includes('/manager/')) {
        await w.focus();
        try { await w.navigate(target); } catch (e) {}
        return;
      }
    }
    await self.clients.openWindow(target);
  })());
});

// ---- the phone's push service replaced this phone's address: sign up again quietly ----
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil((async () => {
    try {
      const old = event.oldSubscription;
      const r = await fetch(DEAL_API + '/push/key');
      const { key } = await r.json();
      const sub = event.newSubscription || await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) });
      if (old && old.endpoint !== sub.endpoint) {
        await fetch(DEAL_API + '/push/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: old.endpoint }) });
      }
      await fetch(DEAL_API + '/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscription: sub.toJSON() }) });
    } catch (e) {}
  })());
});

function keyBytes(b64) {
  const s = b64.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(s + '==='.slice((s.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

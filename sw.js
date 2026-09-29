// Good 2 Go Mart — minimal service worker.
// It only exists so phones treat the site as an installable app.
// It does NOT cache anything, so visitors always see the latest deal and prices.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

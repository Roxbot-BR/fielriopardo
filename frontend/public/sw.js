// Service Worker — Immediate Cache Purge & Network Pass-Through
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => {
        return self.clients.matchAll({ type: 'window' }).then((clients) => {
          for (const client of clients) {
            if (client.url && 'navigate' in client) {
              client.navigate(client.url);
            }
          }
        });
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Always fetch directly from network, never serve from stale cache
  event.respondWith(fetch(event.request));
});

const CACHE_NAME = 'fiel-rio-pardo-v99-force-reload';

self.addEventListener('install', (event) => {
  console.log('[SW v99] Instalado - FORÇANDO RECARGA TOTAL');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW v99] Ativado - LIMPANDO TODOS OS CACHES');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[SW v99] Deletando cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('[SW v99] Todos os caches limpos, assumindo controle');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // NETWORK-ONLY para tudo - sem cache
  event.respondWith(
    fetch(event.request.clone()).catch(() => {
      return new Response('Offline', { status: 503 });
    })
  );
});

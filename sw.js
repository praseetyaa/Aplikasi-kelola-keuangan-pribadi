const CACHE_NAME = 'duitku-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.php?size=192',
  '/icon.php?size=512'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Always fetch JS and API from network first (avoid stale code)
  if (url.pathname.endsWith('.js') || url.pathname.includes('/api/')) {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          // Cache the fresh copy
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          return response;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Other assets: cache-first
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});

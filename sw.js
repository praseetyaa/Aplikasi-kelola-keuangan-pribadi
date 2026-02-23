const CACHE_NAME = 'duitku-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.php?size=192',
  '/icon.php?size=512',
  '/js/app.js',
  '/js/api.js',
  '/js/dashboard.js',
  '/js/transactions.js',
  '/js/categories.js',
  '/js/wallets.js',
  '/js/planning.js',
  '/js/reports.js',
  '/js/settings.js',
  '/js/notifications.js'
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
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});

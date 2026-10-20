const CACHE_NAME = 'autocontabil-shell-v2';
const CORE_ASSETS = [
  './index.html',
  './styles.css',
  './favicon.svg',
  './manifest.webmanifest',
  './privacidade.html',
  './termos.html',
  './404.html',
  './js/app.js',
  './js/utils.js',
  './js/xmlModule.js',
  './js/conciliadorModule.js',
  './js/organizadorModule.js',
  './js/contactModule.js',
  './js/utilitiesModule.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('autocontabil-shell-') && key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      if (request.mode === 'navigate' && response.status === 404) {
        return caches.match(new URL('./404.html', self.registration.scope).href).then((notFound) => notFound || response);
      }
      return response;
    }).catch(() => {
      if (request.mode === 'navigate') return caches.match(new URL('./index.html', self.registration.scope).href);
      return caches.match(request);
    });
  }));
});

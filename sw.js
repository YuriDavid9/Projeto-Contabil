const CACHE_NAME = 'autocontabil-shell-v9';
const CORE_ASSETS = [
  './index.html',
  './ferramentas.html',
  './styles.css',
  './favicon.svg',
  './og-image.png',
  './manifest.webmanifest',
  './privacidade.html',
  './termos.html',
  './validador-cnpj.html',
  './extrator-xml-nfe.html',
  './conciliador-bancario-ofx.html',
  './organizador-fiscal.html',
  './404.html',
  './js/app.js',
  './js/modo.js',
  './js/glossario.js',
  './js/ajuda.js',
  './js/passos.js',
  './js/config.js',
  './js/utils.js',
  './js/xmlModule.js',
  './js/conciliadorModule.js',
  './js/organizadorModule.js',
  './js/contactModule.js',
  './js/utilitiesModule.js',
  './js/ferramentas/catalogo.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(async (cache) => {
    for (const asset of CORE_ASSETS) {
      try {
        await cache.add(asset);
      } catch {
        // Skip missing optional files; the rest of the app can still install.
      }
    }
  }).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('autocontabil-shell-') && key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  const pathname = url.pathname.toLowerCase();
  const cacheFirst = /(?:favicon\.svg|manifest\.webmanifest)$/.test(pathname);
  const networkFirst = request.mode === 'navigate' || /\.(?:js|css|html)$/.test(pathname);
  if (!cacheFirst && !networkFirst) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await caches.match(request);
    if (cacheFirst && cached) return cached;

    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      if (request.mode === 'navigate' && response.status === 404) {
        return (await caches.match(new URL('./404.html', self.registration.scope).href)) || response;
      }
      return response;
    } catch {
      if (cached) return cached;
      if (request.mode === 'navigate') {
        return (await caches.match(new URL('./index.html', self.registration.scope).href)) || Response.error();
      }
      return Response.error();
    }
  })());
});

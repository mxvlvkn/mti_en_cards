/* MTIEN service worker.
 * Навигация и одноимённые файлы — network-first (свежая версия важнее),
 * остальное — stale-while-revalidate. При изменении статики поднимите VERSION.
 */
const VERSION = 'mtien-v3';

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/icon.svg',
  './assets/fonts/roboto-cyrillic.woff2',
  './assets/fonts/roboto-latin.woff2',
  './assets/css/styles.css',
  './assets/js/app.js',
  './assets/js/data.js',
  './assets/js/words.js',
  './assets/vendor/supabase-js.mjs',
  './assets/js/store.js',
  './assets/js/config.js',
  './assets/js/sync.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch((error) => console.warn('[wordly sw] precache', error))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  const isCode = /\.(?:js|css)$/.test(url.pathname);
  event.respondWith(isCode ? networkFirst(request) : staleWhileRevalidate(request));
});

async function networkFirst(request) {
  const cache = await caches.open(VERSION);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const fallback = await cache.match('./index.html');
      if (fallback) return fallback;
    }
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(VERSION);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  return cached || (await network) || Response.error();
}

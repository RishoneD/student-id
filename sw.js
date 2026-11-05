// Service worker: שומר את כל קבצי האפליקציה בטלפון כדי שתעבוד בלי אינטרנט.
// שם המטמון כולל את הגרסה מ-version.js. כדי שטלפונים יקבלו שינוי, יש להעלות את הגרסה שם.
importScripts('./version.js');

const CACHE = `student-id-${self.APP_VERSION}`;
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './totp.js',
  './version.js',
  './vendor/qrcode.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      if (req.mode === 'navigate') {
        return fetch(req).catch(() => caches.match('./index.html'));
      }
      return fetch(req);
    })
  );
});

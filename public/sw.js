// Service worker: lets the game be installed and opened without a connection.
// It only ever touches files of the game itself. Calls to AI providers and local models pass straight through.
const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const CACHE = `class-${VERSION}`;
const SHELL = ['/', '/manifest.webmanifest', '/icon.svg', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

// A new version of the game gets a new cache; older ones are removed.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // The page itself: the network first, so a new version shows up at once; the saved copy when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put('/', copy));
          }
          return response;
        })
        .catch(() => caches.match('/').then(saved => saved || Response.error())),
    );
    return;
  }

  // Scripts, styles and pictures have a name that changes with their content, so a saved copy is always right.
  event.respondWith(
    caches.match(request).then(saved => saved || fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy));
      }
      return response;
    })),
  );
});

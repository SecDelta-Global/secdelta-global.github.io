// Updated Service Worker with cache busting and network-first strategy

const CACHE_VERSION = 'secdelta-cache-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/js/i18n-config.js',
  '/assets/css/i18n.css',
  '/assets/data/translations.json',
  '/assets/data/geo-content.json',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', function(event) {
  console.log('[SW] Installing Service Worker v3...');
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache) {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch(function(error) {
        console.warn('[SW] Some assets failed to cache:', error);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating Service Worker');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_VERSION && cacheName.startsWith('secdelta-cache')) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', function(event) {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external domains
  if (url.origin !== location.origin) {
    return;
  }

  // Strategy: Network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then(function(response) {
        // Don't cache error responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Cache successful responses
        const responseToCache = response.clone();
        caches.open(CACHE_VERSION).then(function(cache) {
          cache.put(request, responseToCache);
        });

        return response;
      })
      .catch(function() {
        // Fallback to cache
        return caches.match(request).then(function(response) {
          if (response) {
            return response;
          }
          // Return offline page if available
          if (request.destination === 'document') {
            return caches.match('/');
          }
        });
      })
  );
});

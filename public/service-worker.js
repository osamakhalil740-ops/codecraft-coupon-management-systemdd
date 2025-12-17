const CACHE_NAME = 'kobonz-v2';
const CACHE_TIMEOUT = 3000; // 3 seconds timeout for cache requests

// Only cache static assets, not HTML pages
const urlsToCache = [
  '/manifest.json',
  '/favicon.svg',
];

self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(err => {
        console.warn('Cache initialization failed:', err);
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Don't cache HTML pages - always fetch fresh
  if (request.method !== 'GET' || 
      url.pathname.endsWith('.html') || 
      url.pathname === '/' ||
      url.hostname.includes('firebasestorage') ||
      url.hostname.includes('firestore') ||
      url.hostname.includes('googleapis')) {
    return event.respondWith(fetch(request));
  }
  
  // Network-first strategy for everything else with timeout
  event.respondWith(
    Promise.race([
      fetch(request).then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // If network fails, try cache
        return caches.match(request);
      }),
      // Timeout fallback
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), CACHE_TIMEOUT)
      ).catch(() => caches.match(request))
    ]).catch(() => {
      // Ultimate fallback
      return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
    })
  );
});

self.addEventListener('activate', (event) => {
  // Take control immediately
  event.waitUntil(
    Promise.all([
      // Clear old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim all clients
      self.clients.claim()
    ])
  );
});

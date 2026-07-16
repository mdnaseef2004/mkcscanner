/**
 * sw.js — Service Worker for Markaz Knowledge City PWA
 * Cache-first for assets, network-first for API calls
 */

const CACHE_NAME = 'mkc-v2';
const OFFLINE_URL = '/pages/offline.html';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/main.css',
  '/css/animations.css',
  '/js/app.js',
  '/js/qr-router.js',
  '/js/map.js',
  '/js/posters.js',
  '/js/story.js',
  '/js/social.js',
  '/js/reviews.js',
  '/js/supabase.js',
  '/js/analytics.js',
  '/js/i18n.js',
  '/assets/logo/markaz_logo.png',
  '/pages/offline.html',
];

// Install — cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(STATIC_ASSETS.filter(url => !url.startsWith('http')))
    )
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // API / CDN calls: network-first
  if (url.hostname.includes('supabase.co') ||
      url.hostname.includes('tile.openstreetmap.org') ||
      url.hostname.includes('unpkg.com') ||
      url.hostname.includes('cdn.jsdelivr.net')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return res;
        })
        .catch(() => {
          // Offline fallback for HTML navigation
          if (event.request.headers.get('Accept')?.includes('text/html')) {
            return caches.match(OFFLINE_URL);
          }
        });
    })
  );
});

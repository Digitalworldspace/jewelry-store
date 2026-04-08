// sw.js - Service Worker for caching
const CACHE_NAME = 'styleoflife-v1';
const urlsToCache = [
    '/',
    '/shop.html',
    '/css/critical.css',
    '/js/performance.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

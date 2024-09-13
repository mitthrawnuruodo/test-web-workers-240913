const CACHE_NAME = 'amiibo-app-cache-v1';
const API_CACHE = 'amiibo-api-cache-v1';
const urlsToCache = [
    '/',                      // HTML file
    '/index.html',             // Main HTML
    '/main.js',                // JavaScript for main logic
    '/worker.js',              // Web Worker script
    '/service-worker.js',      // Service Worker itself
    'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap' // Optional: fonts or other assets
];

// Install the Service Worker and cache the static assets
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Caching app shell and static assets');
            return cache.addAll(urlsToCache);
        })
    );
    self.skipWaiting(); // Activate the service worker immediately
});

// Activate the Service Worker and clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME && cache !== API_CACHE) {
                        console.log('Service Worker clearing old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Fetch event to serve cached files or API responses
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    // Cache the API data (Amiibo data)
    if (url.origin === 'https://www.amiiboapi.com') {
        event.respondWith(
            caches.match(request).then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse; // Return cached response if found
                }

                return fetch(request).then(networkResponse => {
                    // Only cache if the response is valid and comes from the same origin
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        return caches.open(API_CACHE).then(cache => {
                            cache.put(request, networkResponse.clone()); // Cache the API response
                            return networkResponse;
                        });
                    }
                    return networkResponse;
                });
            })
        );
    }

    // Cache images
    else if (request.destination === 'image') {
        event.respondWith(
            caches.match(request).then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse; // Return cached image if available
                }

                return fetch(request).then(networkResponse => {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, networkResponse.clone()); // Cache new image
                        return networkResponse;
                    });
                });
            })
        );
    }

    // Serve other assets from cache (HTML, JS, CSS)
    else {
        event.respondWith(
            caches.match(request).then(cachedResponse => {
                return cachedResponse || fetch(request);
            })
        );
    }
});

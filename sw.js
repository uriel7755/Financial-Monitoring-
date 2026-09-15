const CACHE_NAME = "txn-manager-v2";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];

/* ================================
   INSTALL
================================ */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );

  // Activate the new service worker immediately
  self.skipWaiting();
});


/* ================================
   ACTIVATE
================================ */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );

  // Take control of all open pages immediately
  self.clients.claim();
});


/* ================================
   FETCH
================================ */
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== "GET") {
    return;
  }

  // Only handle requests from this same origin
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {

      const networkResponse = fetch(request)
        .then((response) => {

          // Save a fresh successful response in cache
          if (response && response.ok) {
            const responseClone = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }

          return response;
        })
        .catch(() => {
          // If offline, use cached version
          return cachedResponse;
        });

      // Return cached version immediately if available.
      // Otherwise wait for network.
      return cachedResponse || networkResponse;
    })
  );
});

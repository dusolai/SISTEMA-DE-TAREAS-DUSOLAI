// Cambiamos el nombre de la versión para forzar a los navegadores a actualizar el Service Worker
const CACHE_NAME = 'dualink-v2'; 

const urlsToCache = [
    '/',
    '/manifest.json'
    // IMPORTANTE: Hemos quitado el JS y CSS empaquetado de aquí
];

self.addEventListener('install', event => {
    // Forza al nuevo Service Worker a instalarse inmediatamente
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('activate', event => {
    // Borra los cachés viejos (el 'dualink-v1' que está causando problemas)
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    // Estrategia "Network First" (Red Primero) para la navegación (el index.html)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match('/index.html');
            })
        );
        return;
    }

    // Estrategia "Stale While Revalidate" (Caché con actualización en segundo plano) para el resto
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            const fetchPromise = fetch(event.request).then(networkResponse => {
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, networkResponse.clone());
                });
                return networkResponse;
            }).catch(() => {
                // Si falla la red, no hacemos nada extra aquí
            });

            // Devuelve el caché rápido si existe, pero actualiza en el fondo
            return cachedResponse || fetchPromise;
        })
    );
});

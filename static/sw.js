// Glicelivre Service Worker
const CACHE_NAME = 'glicelivre-v1.0.0';
const STATIC_CACHE_URLS = [
    '/',
    '/static/css/style.css',
    '/static/js/app.js',
    '/static/js/charts.js',
    '/static/icons/icon-192.svg',
    '/static/icons/icon-512.svg',
    '/manifest.json',
    // External dependencies
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
    'https://cdn.jsdelivr.net/npm/feather-icons@4.29.0/dist/feather.min.css',
    'https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.min.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching static assets...');
                return cache.addAll(STATIC_CACHE_URLS);
            })
            .then(() => {
                console.log('Static assets cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Error caching static assets:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other non-http requests
    if (!event.request.url.startsWith('http')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Return cached version if available
                if (cachedResponse) {
                    console.log('Serving from cache:', event.request.url);
                    return cachedResponse;
                }
                
                // Otherwise, fetch from network
                console.log('Fetching from network:', event.request.url);
                return fetch(event.request)
                    .then((response) => {
                        // Check if response is valid
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone the response for caching
                        const responseToCache = response.clone();
                        
                        // Cache successful responses
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch((error) => {
                        console.error('Network request failed:', error);
                        
                        // Return offline page for navigation requests
                        if (event.request.mode === 'navigate') {
                            return caches.match('/');
                        }
                        
                        throw error;
                    });
            })
    );
});

// Background sync for offline data (if supported)
self.addEventListener('sync', (event) => {
    if (event.tag === 'glucose-data-sync') {
        console.log('Background sync triggered for glucose data');
        // Handle any pending data synchronization here
        // This could include uploading data to a cloud service when online
    }
});

// Push notification handling
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Hora de medir sua glicemia!',
        icon: '/static/icons/icon-192.svg',
        badge: '/static/icons/icon-192.svg',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'measure',
                title: 'Medir Agora',
                icon: '/static/icons/icon-192.svg'
            },
            {
                action: 'close',
                title: 'Fechar'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Glicelivre - Lembrete', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'measure') {
        // Open the app to the measurement form
        event.waitUntil(
            clients.openWindow('/?action=new')
        );
    } else if (event.action === 'close') {
        // Just close the notification
        return;
    } else {
        // Default action - open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handling from the main app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'glucose-reminder') {
        event.waitUntil(
            self.registration.showNotification('Glicelivre - Lembrete', {
                body: 'Não se esqueça de medir sua glicemia!',
                icon: '/static/icons/icon-192.svg',
                tag: 'glucose-reminder'
            })
        );
    }
});

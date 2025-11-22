// public/service-worker.js
// Service Worker para Finanzas App v5.0

const CACHE_NAME = 'finanzas-v5-cache-v1';
const STATIC_CACHE = 'finanzas-static-v1';
const DYNAMIC_CACHE = 'finanzas-dynamic-v1';

// Archivos estáticos para cachear
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
];

// ============================================
// INSTALAR SERVICE WORKER
// ============================================
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Precaching archivos estáticos');
        return cache.addAll(STATIC_FILES).catch(err => {
          console.warn('[SW] Error precaching:', err);
          // No fallar si algunos archivos no están disponibles
        });
      })
      .then(() => self.skipWaiting())
  );
});

// ============================================
// ACTIVAR SERVICE WORKER
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            return cacheName !== STATIC_CACHE && 
                   cacheName !== DYNAMIC_CACHE;
          })
          .map(cacheName => {
            console.log('[SW] Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
    .then(() => self.clients.claim())
  );
});

// ============================================
// INTERCEPTAR REQUESTS
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo cachear requests del mismo origen
  if (url.origin !== location.origin) {
    return;
  }

  // Estrategia: Network First con fallback a caché
  event.respondWith(
    fetch(request)
      .then(response => {
        // Clonar respuesta para cachear
        const responseClone = response.clone();
        
        // Cachear respuesta en caché dinámico
        caches.open(DYNAMIC_CACHE).then(cache => {
          cache.put(request, responseClone);
        });
        
        return response;
      })
      .catch(() => {
        // Si falla la red, buscar en caché
        return caches.match(request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Si no hay caché, devolver página offline básica
          if (request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// ============================================
// SKIP WAITING (forzar actualización)
// ============================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
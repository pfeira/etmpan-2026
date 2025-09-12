const CACHE_NAME = 'gestor-torneio-cache-v1.7'; // Versão incrementada para forçar a atualização
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './etmpan1.jpg.jpg', // Adicionando a imagem ao cache
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Teko:wght@500;600&display=swap'
];

// Instala o Service Worker e armazena os ficheiros em cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Interceta os pedidos e serve os ficheiros a partir da cache se disponíveis
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se o ficheiro estiver na cache, retorna-o
        if (response) {
          return response;
        }
        // Caso contrário, vai à rede buscar
        return fetch(event.request);
      }
    )
  );
});

// Limpa caches antigas quando uma nova versão do Service Worker é ativada
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});


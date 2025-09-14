const CACHE_NAME = 'gestor-torneio-cache-v2.1';
const STATIC_CACHE = 'static-v2.1';
const DYNAMIC_CACHE = 'dynamic-v2.1';

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './etmpan1.jpg', // ✅ Corrigido: removida extensão duplicada
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Teko:wght@500;600&display=swap'
];

// ✅ Melhorado: Tratamento de erro no install
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Service Worker: Erro ao cachear recursos:', error);
      })
  );
  self.skipWaiting();
});

// ✅ Melhorado: Estratégia de cache mais robusta
self.addEventListener('fetch', event => {
  // Ignora requisições que não são GET
  if (event.request.method !== 'GET') return;
  
  // Ignora requisições para outros domínios (exceto CDNs conhecidos)
  const url = new URL(event.request.url);
  const isExternal = url.origin !== self.location.origin;
  const isTrustedCDN = url.hostname.includes('cdnjs.cloudflare.com') || 
                      url.hostname.includes('fonts.googleapis.com');
  
  if (isExternal && !isTrustedCDN) return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log('Service Worker: Servindo do cache:', event.request.url);
          return response;
        }
        
        // ✅ Clone da requisição para cache dinâmico
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest)
          .then(response => {
            // ✅ Verifica se a resposta é válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // ✅ Cache dinâmico para novos recursos
            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => {
                cache.put(event.request, responseToCache);
              })
              .catch(error => {
                console.warn('Service Worker: Erro ao cachear dinamicamente:', error);
              });
            
            return response;
          })
          .catch(error => {
            console.error('Service Worker: Erro na requisição:', error);
            // ✅ Fallback para página offline (opcional)
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
            throw error;
          });
      })
  );
});

// ✅ Melhorado: Limpeza mais eficiente de caches antigas
self.addEventListener('activate', event => {
  console.log('Service Worker: Ativando...');
  const cacheWhitelist = [STATIC_CACHE, DYNAMIC_CACHE];
  
  event.waitUntil(
    Promise.all([
      // Limpa caches antigas
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!cacheWhitelist.includes(cacheName)) {
              console.log('Service Worker: Deletando cache antiga:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Assume controle imediatamente
      self.clients.claim()
    ])
  );
});

// ✅ Novo: Event listener para mensagens do cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

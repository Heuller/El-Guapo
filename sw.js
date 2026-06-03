/**
 * ═══════════════════════════════════════════════════════════════════
 * EL GUAPO SERVICE WORKER v5.0
 * Cache Strategy: Cache First (com fallback para rede)
 * Suporte offline completo para o livro de receitas
 * ═══════════════════════════════════════════════════════════════════
 */

const CACHE_NAME = 'el-guapo-v5.0';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json'
];

// Evento de instalação: cachear assets críticos
self.addEventListener('install', (event) => {
    console.log('Service Worker instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Cache aberto:', CACHE_NAME);
            return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
                console.warn('Alguns assets não puderam ser cacheados:', err);
                // Continuar mesmo que alguns assets falhem
                return Promise.resolve();
            });
        })
    );
    self.skipWaiting();
});

// Evento de ativação: limpar caches antigos
self.addEventListener('activate', (event) => {
    console.log('Service Worker ativando...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deletando cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Evento de fetch: estratégia Cache First com fallback para rede
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Ignorar requisições não-GET
    if (request.method !== 'GET') {
        return;
    }

    // Ignorar requisições para chrome extensions
    if (request.url.startsWith('chrome-extension://')) {
        return;
    }

    event.respondWith(
        caches.match(request).then((response) => {
            // Se encontrou no cache, retorna
            if (response) {
                console.log('Cache hit:', request.url);
                return response;
            }

            // Se não encontrou, tenta buscar da rede
            return fetch(request)
                .then((response) => {
                    // Se a resposta for válida, cachear e retornar
                    if (!response || response.status !== 200 || response.type === 'error') {
                        return response;
                    }

                    // Clonar a resposta para poder cacheá-la
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseToCache);
                    });

                    return response;
                })
                .catch(() => {
                    // Se falhar, tentar retornar uma versão em cache
                    return caches.match(request).then((response) => {
                        if (response) {
                            return response;
                        }
                        // Se não houver cache, retornar página offline
                        return caches.match('/').catch(() => {
                            return new Response('Offline - página não disponível', {
                                status: 503,
                                statusText: 'Service Unavailable',
                                headers: new Headers({
                                    'Content-Type': 'text/plain'
                                })
                            });
                        });
                    });
                });
        })
    );
});

// Mensagens do cliente
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('Service Worker carregado com sucesso!');

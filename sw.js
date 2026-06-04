/**
 * ═══════════════════════════════════════════════════════════════════
 * EL GUAPO SERVICE WORKER v2.0
 * Cache Strategy: Network-First para HTML, Cache-First para assets
 * Suporte offline completo + sincronização em background
 * ═══════════════════════════════════════════════════════════════════
 */

const CACHE_NAME = 'el-guapo-v2.0';
const ASSETS_CACHE = 'el-guapo-assets-v2.0';
const RUNTIME_CACHE = 'el-guapo-runtime-v2.0';

const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/sw.js',
    '/images/el-guapo-img-01.webp',
    '/images/el-guapo-img-02.webp',
    '/images/el-guapo-img-03.webp',
    '/images/el-guapo-img-04.webp',
    '/images/el-guapo-img-05.webp',
    '/images/el-guapo-img-06.webp',
    '/images/el-guapo-img-07.webp',
    '/images/el-guapo-img-08.webp',
    '/images/el-guapo-img-09.webp',
    '/images/el-guapo-img-10.webp',
    '/images/el-guapo-img-11.webp',
    '/images/el-guapo-img-12.webp'
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

// Evento de fetch: estratégia inteligente baseada no tipo de requisição
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignorar requisições não-GET
    if (request.method !== 'GET') {
        return;
    }

    // Ignorar requisições para chrome extensions e domínios externos
    if (request.url.startsWith('chrome-extension://') || url.origin !== location.origin) {
        return;
    }

    // Estratégia Network-First para HTML
    if (request.destination === 'document' || request.url.endsWith('.html')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Estratégia Cache-First para CSS, JS, imagens e fonts
    if (isCacheableAsset(request.url)) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // Padrão: Network-First
    event.respondWith(networkFirst(request));
});

// Estratégia: Network-First (tenta rede primeiro, usa cache como fallback)
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.log('[SW] Network failed, trying cache for:', request.url);
        const cached = await caches.match(request);
        if (cached) return cached;
        return caches.match('/index.html') || new Response('Offline', { status: 503 });
    }
}

// Estratégia: Cache-First (usa cache primeiro, tenta rede se não encontrar)
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(ASSETS_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.log('[SW] Network failed for:', request.url);
        return new Response('Offline', { status: 503 });
    }
}

// Detecta se é um asset cacheável
function isCacheableAsset(url) {
    const extensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.woff', '.woff2', '.ttf'];
    return extensions.some(ext => url.toLowerCase().endsWith(ext)) ||
           url.includes('fonts.googleapis.com') ||
           url.includes('fonts.gstatic.com');
}



// Mensagens do cliente
self.addEventListener('message', (event) => {
    const { type } = event.data || {};
    
    if (type === 'SKIP_WAITING') {
        self.skipWaiting();
    } else if (type === 'CLEAR_CACHE') {
        caches.delete(RUNTIME_CACHE).then(() => {
            console.log('[SW] Cache de runtime limpo');
        });
    }
});

console.log('[SW] Service Worker v2.0 carregado com sucesso!');

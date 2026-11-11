/**
 * ═══════════════════════════════════════════════════════════════════
 * EL GUAPO SERVICE WORKER v3.12
 * Cache Strategy: Network-First para HTML, Cache-First para assets
 * Suporte offline completo + sincronização em background
 * ═══════════════════════════════════════════════════════════════════
 */

const CACHE_NAME = 'el-guapo-v3.12';
const ASSETS_CACHE = 'el-guapo-assets-v3.12';
const RUNTIME_CACHE = 'el-guapo-runtime-v3.12';

const ASSETS_TO_CACHE = [
    "./",
    "./index.html",
    "./manifest.json",
    "./sw.js",
    "./splash.css?v=3.12",
    "./splash.js?v=3.12",
    "./assets/licenses/uiverse-hand-MIT.txt",
    "./style.css?v=3.12",
    "./dark-theme.css?v=3.12",
    "./theme-switch.css?v=3.12",
    "./timer-player.css?v=3.12",
    "./assets/icons/clock.svg",
    "./assets/icons/pause.svg",
    "./assets/icons/play.svg",
    "./script.js?v=3.12",
    "./timer-durations.js?v=3.12",
    "./recipe-scaling.js?v=3.12",
    "./shopping-list.js?v=3.12",
    "./ingredient-catalog.js?v=3.12",
    "./shopping-model.js?v=3.12",
    "./assets/fonts/DM-Sans-OFL.txt",
    "./assets/fonts/Fraunces-OFL.txt",
    "./assets/fonts/dm-sans-400-normal.ttf",
    "./assets/fonts/dm-sans-500-normal.ttf",
    "./assets/fonts/dm-sans-600-normal.ttf",
    "./assets/fonts/dm-sans-700-normal.ttf",
    "./assets/fonts/fraunces-400-italic.ttf",
    "./assets/fonts/fraunces-400-normal.ttf",
    "./assets/fonts/fraunces-600-italic.ttf",
    "./assets/fonts/fraunces-600-normal.ttf",
    "./assets/fonts/fraunces-700-normal.ttf",
    "./assets/fonts.css?v=3.12",
    "./assets/icons/LICENSE",
    "./assets/icons/arrow-up-right.svg",
    "./assets/icons/book-open.svg",
    "./assets/icons/chef-hat.svg",
    "./assets/icons/chevron-down.svg",
    "./assets/icons/house.svg",
    "./assets/icons/moon.svg",
    "./assets/icons/search.svg",
    "./assets/icons/shopping-bag.svg",
    "./assets/icons/sun.svg",
    "./assets/icons/x.svg",
    "./images/recipes/arroz-doce.jpg",
    "./images/recipes/banana-bread.jpg",
    "./images/recipes/bolo-cenoura-gabriela.jpg",
    "./images/recipes/bolo-pao-de-mel.jpg",
    "./images/recipes/bolo-prestigio.jpg",
    "./images/recipes/canjicada.jpg",
    "./images/recipes/cuca-com-crumble.jpg",
    "./images/recipes/focaccia.jpg",
    "./images/recipes/massa-de-pizza.jpg",
    "./images/recipes/panetone.jpg",
    "./images/recipes/pao-de-lo-baunilha.jpg",
    "./images/recipes/pao-de-lo-chocolate.jpg",
    "./images/recipes/pao-de-queijo.jpg",
    "./images/recipes/pao-heuller-gabriela.jpg"
];

// Evento de instalação: cachear assets críticos
self.addEventListener('install', (event) => {
    // A failed download must not replace the previous complete offline version.
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(ASSETS_TO_CACHE.map(url => new Request(url, { cache: 'reload' })));
        await self.skipWaiting();
    })());
});

// Evento de ativação: limpar caches antigos
self.addEventListener('activate', (event) => {
    console.log('Service Worker ativando...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName.startsWith('el-guapo-') &&
                        ![CACHE_NAME, ASSETS_CACHE, RUNTIME_CACHE].includes(cacheName)) {
                        console.log('Deletando cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
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
    if (isCacheableAsset(url.pathname)) {
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
        const cached = await matchCurrentCaches(request);
        if (cached) return cached;
        if (request.mode === 'navigate' || request.destination === 'document') {
            const page = await matchCurrentCaches('./index.html');
            if (page) return page;
        }
        return new Response('Offline', { status: 503 });
    }
}

// Estratégia: Cache-First (usa cache primeiro, tenta rede se não encontrar)
async function cacheFirst(request) {
    const cached = await matchCurrentCaches(request);
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

// Never consult caches belonging to another app release.
async function matchCurrentCaches(request) {
    for (const name of [RUNTIME_CACHE, ASSETS_CACHE, CACHE_NAME]) {
        const cache = await caches.open(name);
        const response = await cache.match(request);
        if (response) return response;
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

console.log('[SW] Service Worker v3.12 carregado com sucesso!');

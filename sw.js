const CACHE_NAME = "tokantins-bixopedia-v21";
const CORE_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./data.js",
  "./sketches.js",
  "./manifest.webmanifest",
  "./assets/tokantins-logo.png",
  "./assets/icons/to-icon-cropped.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/maskable-512.png",
  "./assets/bixos/aranguejera.png",
  "./assets/bixos/armaderanha.png",
  "./assets/bixos/chuvaruga.png",
  "./assets/bixos/duendussu-amarelo.png",
  "./assets/bixos/duendussu-azul.png",
  "./assets/bixos/duendussu-padrao.png",
  "./assets/bixos/duendussu-verde.png",
  "./assets/bixos/foguara.png",
  "./assets/bixos/ipema-amarela.png",
  "./assets/bixos/ipema-branca.png",
  "./assets/bixos/ipema-gif.gif",
  "./assets/bixos/ipema-rosa.png",
  "./assets/bixos/ipema-roxa.png",
  "./assets/bixos/ipema-shiny.png",
  "./assets/bixos/ipema-verde.png",
  "./assets/bixos/lobareda-2-0.png",
  "./assets/bixos/lobizarro.png",
  "./assets/bixos/loborralha.png",
  "./assets/bixos/pequiacu.png",
  "./assets/bixos/pequitaxo.png",
  "./assets/bixos/pequituxo-2-0.png",
  "./assets/bixos/sacolina.png",
  "./assets/bixos/solamigo.png",
  "./assets/bixos/tigraroa.png",
  "./assets/bixos/tracajato-2-0.png",
  "./assets/bixos/xorumina.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  if (
    request.mode === "navigate" ||
    ["document", "script", "style", "manifest"].includes(request.destination) ||
    /\.(html|js|css|json|webmanifest)$/i.test(url.pathname)
  ) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

// Simple offline cache for GitHub Pages
const CACHE = 'mlo-prep-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './lib/ui.js',
  './lib/views.js',
  './lib/pwa.js',
  './manifest.webmanifest',
  './data/flashcards.json',
  './data/questions.json'
];

self.addEventListener('install', (event)=>{
  event.waitUntil(
    caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate', (event)=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE?caches.delete(k):null)))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', (event)=>{
  event.respondWith(
    caches.match(event.request).then(cached=>{
      return cached || fetch(event.request).then(res=>{
        const copy = res.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request, copy)).catch(()=>{});
        return res;
      }).catch(()=>cached);
    })
  );
});

const CACHE = 'ponte-v3';
const SHELL = [
  './',
  './index.html',
  './css/style.css',
  './js/cards.js',
  './js/app.js',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate', (e)=>{
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', (e)=>{
  if(e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Never cache API calls (GitHub sync must stay live)
  if(url.hostname.includes('api.github.com')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if(res && res.ok && url.origin === self.location.origin){
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(()=> cached);
      return cached || network;
    })
  );
});

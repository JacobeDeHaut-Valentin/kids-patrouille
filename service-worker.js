const CACHE = 'kp-v4';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(CACHE).then(c =>
    c.match(e.request).then(h => {
      const f = fetch(e.request).then(r => {
        if (r && r.status === 200) c.put(e.request, r.clone());
        return r;
      }).catch(() => h);
      return h || f;
    })
  ));
});
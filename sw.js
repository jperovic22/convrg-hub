const CACHE = 'convrg-hub-v5';
const ASSETS = [
  '/convrg-hub/',
  '/convrg-hub/index.html',
  '/convrg-hub/manifest.json',
  '/convrg-hub/icon-192.png',
  '/convrg-hub/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('anthropic.com') ||
      e.request.url.includes('googleapis.com') ||
      e.request.url.includes('supabase.co')) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// ── PUSH NOTIFICATIONS ──
self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/convrg-hub/icon-192.png',
      badge: '/convrg-hub/icon-192.png',
      tag: data.tag || 'convrg-task',
      data: data.data || {},
      vibrate: [200, 100, 200],
    })
  );
});

// Tap notification → open hub
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || 'https://jperovic22.github.io/convrg-hub/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes('convrg-hub'));
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});

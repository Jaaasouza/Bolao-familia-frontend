/* Minimal service worker for USAM World Cup 2026.
 *
 * Today it only enables PWA install (Android/Chrome require a registered SW)
 * and a network-first fetch passthrough. Web-push handlers (push / click) will
 * be added in the notifications phase.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Passthrough fetch — no offline caching yet (the app needs live data).
self.addEventListener('fetch', () => { /* default network handling */ });

// --- Web push (wired up in the notifications phase) ---
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch { data = { title: 'USAM 2026', body: event.data.text() }; }
  const title = data.title || 'USAM World Cup 2026';
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(self.clients.openWindow(url));
});

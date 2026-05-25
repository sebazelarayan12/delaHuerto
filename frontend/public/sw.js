self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  if (!event.data) return
  const { title, body } = event.data.json()
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/notification-icon.png',
      badge: '/badge.png',
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow('/admin/pedidos'))
})

self.addEventListener('push', (event) => {
  if (!event.data) return
  const { title, body } = event.data.json()
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow('/admin/pedidos'))
})

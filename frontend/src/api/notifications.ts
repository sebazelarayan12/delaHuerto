import { api } from './axios'

export interface NotificationConfig {
  id: number
  enabled: boolean
  notificationTime: string
  lastSentDate: string | null
}

export interface PushSubscriptionPayload {
  endpoint: string
  p256dh: string
  auth: string
}

export const notificationsApi = {
  getConfig: () => api.get<NotificationConfig>('/api/admin/notifications/config').then((r) => r.data),

  updateConfig: (data: Partial<Pick<NotificationConfig, 'enabled' | 'notificationTime'>>) =>
    api.put<NotificationConfig>('/api/admin/notifications/config', data).then((r) => r.data),

  subscribe: (payload: PushSubscriptionPayload) =>
    api.post('/api/admin/notifications/subscribe', payload).then((r) => r.data),

  unsubscribe: (endpoint: string) =>
    api.delete('/api/admin/notifications/subscribe', { data: { endpoint } }).then((r) => r.data),
}

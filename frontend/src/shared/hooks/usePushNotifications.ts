import { useState, useEffect } from 'react'
import { config } from '../../config/env'
import { notificationsApi } from '../../api/notifications'

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; i++) view[i] = rawData.charCodeAt(i)
  return view
}

export type NotificationPermission = 'default' | 'granted' | 'denied'

interface UsePushNotificationsResult {
  isSupported: boolean
  permission: NotificationPermission
  isSubscribed: boolean
  isLoading: boolean
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
}

export function usePushNotifications(): UsePushNotificationsResult {
  const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
  const [permission, setPermission] = useState<NotificationPermission>(
    isSupported ? (Notification.permission as NotificationPermission) : 'denied'
  )
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isSupported) return
    navigator.serviceWorker.ready.then(async (reg) => {
      const existing = await reg.pushManager.getSubscription()
      setIsSubscribed(!!existing)
    })
  }, [isSupported])

  async function subscribe() {
    if (!isSupported || !config.vapidPublicKey) return
    setIsLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const perm = await Notification.requestPermission()
      setPermission(perm as NotificationPermission)
      if (perm !== 'granted') return

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey),
      })

      const json = sub.toJSON()
      await notificationsApi.subscribe({
        endpoint: sub.endpoint,
        p256dh: (json.keys as Record<string, string>).p256dh,
        auth: (json.keys as Record<string, string>).auth,
      })

      setIsSubscribed(true)
    } finally {
      setIsLoading(false)
    }
  }

  async function unsubscribe() {
    if (!isSupported) return
    setIsLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) return
      await notificationsApi.unsubscribe(sub.endpoint)
      await sub.unsubscribe()
      setIsSubscribed(false)
    } finally {
      setIsLoading(false)
    }
  }

  return { isSupported, permission, isSubscribed, isLoading, subscribe, unsubscribe }
}

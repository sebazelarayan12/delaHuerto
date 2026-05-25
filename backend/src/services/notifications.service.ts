import webpush from 'web-push'
import { prisma } from '../db.js'
import { env } from '../env.js'

webpush.setVapidDetails(
  `mailto:${env.VAPID_EMAIL}`,
  env.VAPID_PUBLIC_KEY,
  env.VAPID_PRIVATE_KEY
)

interface SubscriptionInput {
  endpoint: string
  p256dh: string
  auth: string
}

interface ConfigInput {
  enabled?: boolean
  notificationTime?: string
}

function getArgentinaTimeStr(): string {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }))
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function getArgentinaDateStr(): string {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }))
  const y = now.getFullYear()
  const mo = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${mo}-${d}`
}

function getTomorrowUTCRange(): { start: Date; end: Date } {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }))
  const y = now.getFullYear()
  const mo = now.getMonth()
  const d = now.getDate()
  const start = new Date(Date.UTC(y, mo, d + 1))
  const end = new Date(Date.UTC(y, mo, d + 2))
  return { start, end }
}

export class NotificationsService {
  static async saveSubscription(data: SubscriptionInput) {
    return prisma.pushSubscription.upsert({
      where: { endpoint: data.endpoint },
      update: { p256dh: data.p256dh, auth: data.auth },
      create: data,
    })
  }

  static async removeSubscription(endpoint: string) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint } })
  }

  static async getConfig() {
    const existing = await prisma.notificationConfig.findFirst()
    if (existing) return existing
    return prisma.notificationConfig.create({ data: {} })
  }

  static async updateConfig(data: ConfigInput) {
    const config = await NotificationsService.getConfig()
    return prisma.notificationConfig.update({
      where: { id: config.id },
      data,
    })
  }

  static async sendDailyReminderIfNeeded() {
    const config = await prisma.notificationConfig.findFirst()
    if (!config || !config.enabled) return

    const currentTime = getArgentinaTimeStr()
    if (currentTime !== config.notificationTime) return

    const todayDate = getArgentinaDateStr()
    if (config.lastSentDate === todayDate) return

    const { start, end } = getTomorrowUTCRange()
    const pedidos = await prisma.pedido.findMany({
      where: {
        fechaEntrega: { gte: start, lt: end },
        estado: { not: 'cancelado' },
      },
      select: { nombre: true },
    })

    if (pedidos.length === 0) return

    const suscripciones = await prisma.pushSubscription.findMany()
    if (suscripciones.length === 0) return

    const names = pedidos
      .slice(0, 3)
      .map((p) => p.nombre)
      .join(', ')
    const extra = pedidos.length > 3 ? ` y ${pedidos.length - 3} mas` : ''

    const payload = JSON.stringify({
      title: `Pedidos para manana (${pedidos.length})`,
      body: `${names}${extra}`,
    })

    await Promise.allSettled(
      suscripciones.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    )

    await prisma.notificationConfig.update({
      where: { id: config.id },
      data: { lastSentDate: todayDate },
    })

    console.log(`[NOTIF] Push enviado — ${pedidos.length} pedidos para manana`)
  }

  static async forceSend() {
    const suscripciones = await prisma.pushSubscription.findMany()
    if (suscripciones.length === 0) return { sent: 0 }

    const payload = JSON.stringify({
      title: 'Test de notificacion',
      body: 'Si ves esto, las push notifications funcionan correctamente.',
    })

    await Promise.allSettled(
      suscripciones.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    )

    console.log(`[NOTIF] Force-send — ${suscripciones.length} suscripciones`)
    return { sent: suscripciones.length }
  }
}

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { NotificationsService } from '../services/notifications.service.js'

const admin = new Hono()
admin.use('/*', authMiddleware)

const subscribeSchema = z.object({
  endpoint: z.string().min(1),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
})

const configSchema = z.object({
  enabled: z.boolean().optional(),
  notificationTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
})

admin.post('/subscribe', zValidator('json', subscribeSchema), async (c) => {
  const data = c.req.valid('json')
  console.log('[POST] /api/admin/notifications/subscribe')
  const sub = await NotificationsService.saveSubscription(data)
  return c.json(sub, 201)
})

admin.delete('/subscribe', zValidator('json', z.object({ endpoint: z.string().min(1) })), async (c) => {
  const { endpoint } = c.req.valid('json')
  console.log('[DELETE] /api/admin/notifications/subscribe')
  await NotificationsService.removeSubscription(endpoint)
  return c.json({ ok: true })
})

admin.get('/config', async (c) => {
  const config = await NotificationsService.getConfig()
  return c.json(config)
})

admin.put('/config', zValidator('json', configSchema), async (c) => {
  const data = c.req.valid('json')
  console.log('[PUT] /api/admin/notifications/config')
  const config = await NotificationsService.updateConfig(data)
  return c.json(config)
})

admin.post('/test-send', async (c) => {
  const result = await NotificationsService.forceSend()
  return c.json({ ok: true, ...result })
})

export { admin as notificationsAdminRoutes }

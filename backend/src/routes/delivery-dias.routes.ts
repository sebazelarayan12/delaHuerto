import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { DeliveryDiasService } from '../services/delivery-dias.service.js'

const publicRoutes = new Hono()

publicRoutes.get('/', async (c) => {
  const config = await DeliveryDiasService.getConfig()
  return c.json({ dias: config.dias })
})

const admin = new Hono()
admin.use('/*', authMiddleware)

const diasSchema = z.object({
  dias: z.array(z.boolean()).length(7),
})

admin.put('/', zValidator('json', diasSchema), async (c) => {
  const { dias } = c.req.valid('json')
  console.log('[PUT] /api/admin/delivery-dias')
  const config = await DeliveryDiasService.updateDias(dias)
  return c.json({ dias: config.dias })
})

export { publicRoutes as deliveryDiasPublicRoutes, admin as deliveryDiasAdminRoutes }

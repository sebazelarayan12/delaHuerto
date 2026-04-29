import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { BannerService } from '../services/banner.service.js'

const bannerUpdateSchema = z.object({
  titulo: z.string().min(1).optional(),
  linea1: z.string().optional(),
  linea2: z.string().optional(),
  activo: z.boolean().optional(),
})

const publicRoutes = new Hono()

publicRoutes.get('/', async (c) => {
  const banner = await BannerService.getBanner()
  return c.json(banner)
})

const adminRoutes = new Hono()
adminRoutes.use('/*', authMiddleware)

adminRoutes.put('/', zValidator('json', bannerUpdateSchema), async (c) => {
  const data = c.req.valid('json')
  const banner = await BannerService.updateBanner(data)
  console.log('[BANNER] Updated:', JSON.stringify(data))
  return c.json(banner)
})

export { publicRoutes as bannerPublicRoutes, adminRoutes as bannerAdminRoutes }

import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { MercadoPagoOAuthService } from '../services/mercadopago-oauth.service.js'

const admin = new Hono()
admin.use('/*', authMiddleware)

admin.get('/authorize', async (c) => {
  const url = MercadoPagoOAuthService.buildAuthorizationUrl()
  console.log('[GET] /api/admin/mercadopago/authorize')
  return c.json({ url })
})

admin.get('/status', async (c) => {
  const status = await MercadoPagoOAuthService.getStatus()
  return c.json(status)
})

export { admin as mercadopagoAdminRoutes }

import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { MercadoPagoOAuthService } from '../services/mercadopago-oauth.service.js'
import { modo } from '../env.js'

const admin = new Hono()
admin.use('/*', authMiddleware)

admin.get('/authorize', async (c) => {
  // La conexion OAuth conecta la cuenta REAL del cliente - nunca se debe disparar en
  // development, donde se sigue usando el token de sandbox del desarrollador.
  if (modo !== 'production') {
    return c.json({ error: 'Conectar Mercado Pago solo esta disponible en produccion' }, 403)
  }
  const url = MercadoPagoOAuthService.buildAuthorizationUrl()
  console.log('[GET] /api/admin/mercadopago/authorize')
  return c.json({ url })
})

admin.get('/status', async (c) => {
  const status = await MercadoPagoOAuthService.getStatus()
  return c.json(status)
})

export { admin as mercadopagoAdminRoutes }

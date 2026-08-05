import { Hono } from 'hono'
import { MercadoPagoWebhookService } from '../services/mercadopago-webhook.service.js'

const publicRoutes = new Hono()

publicRoutes.post('/mercadopago', async (c) => {
  let paymentId: string | undefined

  const type = c.req.query('type') ?? c.req.query('topic')
  const queryId = c.req.query('id') ?? c.req.query('data.id')

  if (type === 'payment' && queryId) {
    paymentId = queryId
  } else {
    const body = await c.req.json().catch(() => null)
    if (body?.type === 'payment' && body?.data?.id) {
      paymentId = String(body.data.id)
    }
  }

  if (!paymentId) {
    console.log('[POST] /api/webhooks/mercadopago - notificacion ignorada (sin payment id)')
    return c.json({ ok: true })
  }

  console.log('[POST] /api/webhooks/mercadopago - payment id:', paymentId)
  await MercadoPagoWebhookService.procesarNotificacion(paymentId)
  return c.json({ ok: true })
})

export { publicRoutes as webhooksPublicRoutes }

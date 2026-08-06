import { Hono } from 'hono'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { MercadoPagoWebhookService } from '../services/mercadopago-webhook.service.js'
import { env, modo } from '../env.js'

const publicRoutes = new Hono()

function verificarFirmaMercadoPago(xSignature: string | undefined, xRequestId: string | undefined, dataId: string | undefined): boolean {
  if (!env.MP_WEBHOOK_SECRET) return true
  if (!xSignature || !xRequestId || !dataId) return false

  const partes: Record<string, string> = {}
  for (const par of xSignature.split(',')) {
    const [clave, valor] = par.split('=').map((s) => s.trim())
    if (clave && valor) partes[clave] = valor
  }

  const ts = partes.ts
  const v1 = partes.v1
  if (!ts || !v1) return false

  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`
  const esperado = createHmac('sha256', env.MP_WEBHOOK_SECRET).update(manifest).digest('hex')

  const esperadoBuf = Buffer.from(esperado, 'hex')
  const recibidoBuf = Buffer.from(v1, 'hex')
  if (esperadoBuf.length !== recibidoBuf.length) return false

  return timingSafeEqual(esperadoBuf, recibidoBuf)
}

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

  const dataIdParaFirma = c.req.query('data.id') ?? paymentId
  const firmaValida = verificarFirmaMercadoPago(c.req.header('x-signature'), c.req.header('x-request-id'), dataIdParaFirma)

  if (!firmaValida) {
    if (modo === 'production') {
      console.log('[POST] /api/webhooks/mercadopago - firma invalida, notificacion rechazada')
      return c.json({ error: 'Firma invalida' }, 401)
    }
    console.log('[POST] /api/webhooks/mercadopago - firma invalida ignorada (modo development, MP a veces firma con secret distinto al del panel en sandbox); se revalida el pago contra la API de MP igual')
  }

  console.log('[POST] /api/webhooks/mercadopago - payment id:', paymentId)
  await MercadoPagoWebhookService.procesarNotificacion(paymentId)
  return c.json({ ok: true })
})

export { publicRoutes as webhooksPublicRoutes }

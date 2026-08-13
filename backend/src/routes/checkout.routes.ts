import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { CheckoutService } from '../services/checkout.service.js'

const publicRoutes = new Hono()

const itemCheckoutSchema = z.object({
  productoId: z.number().int().positive(),
  cantidad: z.number().int().positive(),
  modalidad: z.enum(['cocinada', 'congelada']),
})

const crearPreferenceSchema = z.object({
  nombre: z.string().min(1),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  notas: z.string().optional(),
  fechaEntrega: z.string().optional(),
  items: z.array(itemCheckoutSchema).min(1),
})

publicRoutes.post('/mercadopago', zValidator('json', crearPreferenceSchema), async (c) => {
  const data = c.req.valid('json')
  console.log('[POST] /api/checkout/mercadopago - preference para:', data.nombre)
  const { initPoint } = await CheckoutService.crearPreference(data)
  return c.json({ initPoint })
})

export { publicRoutes as checkoutPublicRoutes }

import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { VentasService } from '../services/ventas.service.js'

const itemSchema = z.object({
  productoId: z.number().int().positive(),
  cantidad: z.number().int().min(1, { message: 'minimo 1' }),
  precioUnitario: z.number().positive(),
})

const ventaSchema = z.object({
  items: z.array(itemSchema).min(1, { message: 'agregar al menos un producto' }),
  notas: z.string().optional(),
  fecha: z.string().optional(),
})

const admin = new Hono()
admin.use('/*', authMiddleware)

admin.get('/', async (c) => {
  const { desde, hasta } = c.req.query()
  const ventas = await VentasService.getVentas(desde, hasta)
  return c.json(ventas)
})

admin.post('/', zValidator('json', ventaSchema), async (c) => {
  const { items, notas, fecha } = c.req.valid('json')
  console.log(`[ventas] registrar venta — ${items.length} items`)
  const venta = await VentasService.createVenta(items, notas, fecha)
  return c.json(venta, 201)
})

admin.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  console.log(`[ventas] cancelar venta ${id}`)
  await VentasService.deleteVenta(id)
  return c.json({ ok: true })
})

export { admin as ventasAdminRoutes }

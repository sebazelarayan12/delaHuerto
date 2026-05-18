import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { StockService } from '../services/stock.service.js'

const ajusteSchema = z.object({
  cantidad: z.number().int().refine((n) => n !== 0, { message: 'cantidad no puede ser 0' }),
  motivo: z.string().min(1, { message: 'motivo requerido' }),
})

const admin = new Hono()
admin.use('/*', authMiddleware)

admin.get('/', async (c) => {
  const productos = await StockService.getProductsWithStock()
  return c.json(productos)
})

admin.post('/:id/ajuste', zValidator('json', ajusteSchema), async (c) => {
  const id = parseInt(c.req.param('id'))
  const { cantidad, motivo } = c.req.valid('json')
  console.log(`[stock] ajuste producto ${id}: ${cantidad > 0 ? '+' : ''}${cantidad} — ${motivo}`)
  const ajuste = await StockService.adjustStock(id, cantidad, motivo)
  return c.json(ajuste, 201)
})

admin.get('/:id/historial', async (c) => {
  const id = parseInt(c.req.param('id'))
  const historial = await StockService.getHistorial(id)
  return c.json(historial)
})

export { admin as stockAdminRoutes }

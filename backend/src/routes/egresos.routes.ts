import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { EgresosService } from '../services/egresos.service.js'

const egresoSchema = z.object({
  categoriaId: z.number().int().positive(),
  monto: z.number().positive(),
  descripcion: z.string().optional(),
  fecha: z.string().optional(),
})

const admin = new Hono()
admin.use('/*', authMiddleware)

admin.get('/', async (c) => {
  const { desde, hasta } = c.req.query()
  const egresos = await EgresosService.getEgresos(desde, hasta)
  return c.json(egresos)
})

admin.post('/', zValidator('json', egresoSchema), async (c) => {
  const data = c.req.valid('json')
  console.log(`[egresos] registrar egreso — categoria ${data.categoriaId}, monto ${data.monto}`)
  const egreso = await EgresosService.createEgreso(data)
  return c.json(egreso, 201)
})

admin.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  console.log(`[egresos] eliminar egreso ${id}`)
  await EgresosService.deleteEgreso(id)
  return c.json({ ok: true })
})

export { admin as egresosAdminRoutes }

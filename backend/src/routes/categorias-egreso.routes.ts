import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { CategoriasEgresoService } from '../services/categorias-egreso.service.js'

const categoriaEgresoSchema = z.object({
  nombre: z.string().min(1),
  activa: z.boolean().default(true),
})

const admin = new Hono()
admin.use('/*', authMiddleware)

admin.get('/', async (c) => {
  const categorias = await CategoriasEgresoService.getCategorias()
  return c.json(categorias)
})

admin.post('/', zValidator('json', categoriaEgresoSchema), async (c) => {
  const data = c.req.valid('json')
  console.log(`[categorias-egreso] crear categoria — ${data.nombre}`)
  const categoria = await CategoriasEgresoService.createCategoria(data)
  return c.json(categoria, 201)
})

admin.put('/:id', zValidator('json', categoriaEgresoSchema.partial()), async (c) => {
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')
  console.log(`[categorias-egreso] editar categoria ${id}`)
  const categoria = await CategoriasEgresoService.updateCategoria(id, data)
  return c.json(categoria)
})

admin.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  console.log(`[categorias-egreso] eliminar categoria ${id}`)
  await CategoriasEgresoService.deleteCategoria(id)
  return c.json({ ok: true })
})

export { admin as categoriasEgresoAdminRoutes }

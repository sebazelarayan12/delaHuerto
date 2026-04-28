import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { CategoriasService } from '../services/categorias.service.js'

const app = new Hono()

const categoriaSchema = z.object({
  nombre: z.string().min(1),
  orden: z.coerce.number().default(0),
  activa: z.boolean().default(true),
})

// Public: active categories with available products
app.get('/', async (c) => {
  const categorias = await CategoriasService.getPublicCategories()
  return c.json(categorias)
})

// Admin routes
const admin = new Hono()
admin.use('/*', authMiddleware)

admin.get('/', async (c) => {
  const categorias = await CategoriasService.getAdminCategories()
  return c.json(categorias)
})

admin.post('/', zValidator('json', categoriaSchema), async (c) => {
  const data = c.req.valid('json')
  const categoria = await CategoriasService.createCategory(data)
  return c.json(categoria, 201)
})

admin.put('/:id', zValidator('json', categoriaSchema.partial()), async (c) => {
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')
  const categoria = await CategoriasService.updateCategory(id, data)
  return c.json(categoria)
})

admin.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  await CategoriasService.deleteCategory(id)
  return c.json({ ok: true })
})

admin.post('/reorder', zValidator('json', z.object({ ordenes: z.array(z.object({ id: z.number(), orden: z.number() })) })), async (c) => {
  const { ordenes } = c.req.valid('json')
  await CategoriasService.reorderCategories(ordenes)
  return c.json({ ok: true })
})

const descuentoSchema = z.array(z.object({
  cantidadMinima: z.number().int().positive(),
  porcentaje: z.number().positive().max(100),
}))

admin.put('/:id/descuentos', zValidator('json', descuentoSchema), async (c) => {
  const id = parseInt(c.req.param('id'))
  const tiers = c.req.valid('json')
  await CategoriasService.syncDescuentos(id, tiers)
  return c.json({ ok: true })
})

export { app as categoriasPublicRoutes, admin as categoriasAdminRoutes }

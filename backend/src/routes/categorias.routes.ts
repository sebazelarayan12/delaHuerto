import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../db.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const app = new Hono()

const categoriaSchema = z.object({
  nombre: z.string().min(1),
  orden: z.coerce.number().default(0),
  activa: z.boolean().default(true),
})

// Public: active categories with available products
app.get('/', async (c) => {
  try {
    const categorias = await prisma.categoria.findMany({
      where: { activa: true },
      orderBy: { orden: 'asc' },
      include: {
        productos: {
          where: { disponible: true },
          orderBy: { orden: 'asc' },
        },
      },
    })
    return c.json(categorias)
  } catch (e) {
    return c.json({ error: 'Error al obtener categorías' }, 500)
  }
})

// Admin routes
const admin = new Hono()
admin.use('/*', authMiddleware)

admin.get('/', async (c) => {
  try {
    const categorias = await prisma.categoria.findMany({
      orderBy: { orden: 'asc' },
    })
    return c.json(categorias)
  } catch (e) {
    return c.json({ error: 'Error al obtener categorías' }, 500)
  }
})

admin.post('/', zValidator('json', categoriaSchema), async (c) => {
  try {
    const data = c.req.valid('json')
    const categoria = await prisma.categoria.create({ data })
    return c.json(categoria, 201)
  } catch (e) {
    return c.json({ error: 'Error al crear categoría' }, 500)
  }
})

admin.put('/:id', zValidator('json', categoriaSchema.partial()), async (c) => {
  const id = parseInt(c.req.param('id'))
  try {
    const data = c.req.valid('json')
    const categoria = await prisma.categoria.update({ where: { id }, data })
    return c.json(categoria)
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2025') return c.json({ error: 'Categoría no encontrada' }, 404)
    return c.json({ error: 'Error al actualizar categoría' }, 500)
  }
})

admin.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  try {
    const categoria = await prisma.categoria.update({
      where: { id },
      data: { activa: false },
    })
    return c.json(categoria)
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2025') return c.json({ error: 'Categoría no encontrada' }, 404)
    return c.json({ error: 'Error al desactivar categoría' }, 500)
  }
})

export { app as categoriasPublicRoutes, admin as categoriasAdminRoutes }

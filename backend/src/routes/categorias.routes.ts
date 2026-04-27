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
    const dup = await prisma.categoria.findFirst({ where: { orden: data.orden } })
    if (dup) return c.json({ error: `Ya existe una categoría con el orden ${data.orden}` }, 409)
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
    if (data.orden !== undefined) {
      const dup = await prisma.categoria.findFirst({ where: { orden: data.orden, NOT: { id } } })
      if (dup) return c.json({ error: `Ya existe una categoría con el orden ${data.orden}` }, 409)
    }
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
    const count = await prisma.producto.count({ where: { categoriaId: id } })
    if (count > 0) return c.json({ error: 'La categoría tiene productos. Eliminá los productos primero.' }, 409)
    await prisma.categoria.delete({ where: { id } })
    return c.json({ ok: true })
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2025') return c.json({ error: 'Categoría no encontrada' }, 404)
    return c.json({ error: 'Error al eliminar categoría' }, 500)
  }
})

admin.post('/reorder', zValidator('json', z.object({ ordenes: z.array(z.object({ id: z.number(), orden: z.number() })) })), async (c) => {
  try {
    const { ordenes } = c.req.valid('json')
    await prisma.$transaction(
      ordenes.map((o) => prisma.categoria.update({ where: { id: o.id }, data: { orden: o.orden } }))
    )
    return c.json({ ok: true })
  } catch (e) {
    return c.json({ error: 'Error al reordenar categorías' }, 500)
  }
})

export { app as categoriasPublicRoutes, admin as categoriasAdminRoutes }

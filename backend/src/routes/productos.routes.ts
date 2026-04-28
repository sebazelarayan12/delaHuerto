import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { ProductosService } from '../services/productos.service.js'

const productoSchema = z.object({
  categoriaId: z.coerce.number(),
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  precio: z.coerce.number().positive(),
  precioUnidad: z.coerce.number().positive().optional(),
  disponible: z.preprocess((v) => v === 'true' || v === true, z.boolean()).default(true),
  orden: z.coerce.number().default(0),
})

const admin = new Hono()
admin.use('/*', authMiddleware)

admin.get('/', async (c) => {
  const productos = await ProductosService.getAdminProducts()
  return c.json(productos)
})

admin.post('/', async (c) => {
  const formData = await c.req.formData()
  const rawData: Record<string, unknown> = {}
  for (const [key, value] of formData.entries()) {
    if (!(value instanceof File)) rawData[key] = value
  }
  const parsed = productoSchema.safeParse(rawData)
  if (!parsed.success) return c.json({ error: 'Datos inválidos', details: parsed.error.issues }, 400)

  const file = formData.get('foto')
  const producto = await ProductosService.createProduct(parsed.data, file instanceof File ? file : null)
  return c.json(producto, 201)
})

admin.put('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const formData = await c.req.formData()
  const rawData: Record<string, unknown> = {}
  for (const [key, value] of formData.entries()) {
    if (!(value instanceof File)) rawData[key] = value
  }
  const parsed = productoSchema.partial().safeParse(rawData)
  if (!parsed.success) return c.json({ error: 'Datos inválidos', details: parsed.error.issues }, 400)

  const file = formData.get('foto')
  const producto = await ProductosService.updateProduct(id, parsed.data, file instanceof File ? file : null)
  return c.json(producto)
})

admin.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  await ProductosService.deleteProduct(id)
  return c.json({ ok: true })
})

export { admin as productosAdminRoutes }

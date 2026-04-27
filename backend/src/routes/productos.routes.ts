import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../db.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { uploadImage, deleteImage } from '../lib/cloudinary.js'

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
  try {
    const productos = await prisma.producto.findMany({
      orderBy: { orden: 'asc' },
      include: { categoria: true },
    })
    return c.json(productos)
  } catch (e) {
    return c.json({ error: 'Error al obtener productos' }, 500)
  }
})

admin.post('/', async (c) => {
  try {
    const formData = await c.req.formData()
    const rawData: Record<string, unknown> = {}
    for (const [key, value] of formData.entries()) {
      if (!(value instanceof File)) rawData[key] = value
    }
    const parsed = productoSchema.safeParse(rawData)
    if (!parsed.success) return c.json({ error: 'Datos inválidos', details: parsed.error.issues }, 400)

    const data = parsed.data
    const dup = await prisma.producto.findFirst({ where: { orden: data.orden, categoriaId: data.categoriaId } })
    if (dup) return c.json({ error: `Ya existe un producto con el orden ${data.orden} en esa categoría` }, 409)

    let fotoUrl: string | undefined
    let fotoPublicId: string | undefined

    const file = formData.get('foto')
    if (file instanceof File && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const uploaded = await uploadImage(buffer)
      fotoUrl = uploaded.url
      fotoPublicId = uploaded.publicId
    }

    const producto = await prisma.producto.create({
      data: {
        categoriaId: data.categoriaId,
        nombre: data.nombre,
        descripcion: data.descripcion,
        precio: data.precio,
        precioUnidad: data.precioUnidad,
        disponible: data.disponible,
        orden: data.orden,
        fotoUrl,
        fotoPublicId,
      },
      include: { categoria: true },
    })
    return c.json(producto, 201)
  } catch (e) {
    console.error(e)
    return c.json({ error: 'Error al crear producto' }, 500)
  }
})

admin.put('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  try {
    const formData = await c.req.formData()
    const rawData: Record<string, unknown> = {}
    for (const [key, value] of formData.entries()) {
      if (!(value instanceof File)) rawData[key] = value
    }
    const parsed = productoSchema.partial().safeParse(rawData)
    if (!parsed.success) return c.json({ error: 'Datos inválidos', details: parsed.error.issues }, 400)

    const data = parsed.data
    if (data.orden !== undefined && data.categoriaId !== undefined) {
      const dup = await prisma.producto.findFirst({ where: { orden: data.orden, categoriaId: data.categoriaId, NOT: { id } } })
      if (dup) return c.json({ error: `Ya existe un producto con el orden ${data.orden} en esa categoría` }, 409)
    }
    const updateData: Record<string, unknown> = { ...data }

    const file = formData.get('foto')
    if (file instanceof File && file.size > 0) {
      const existing = await prisma.producto.findUnique({ where: { id } })
      if (existing?.fotoPublicId) {
        await deleteImage(existing.fotoPublicId).catch(() => {})
      }
      const buffer = Buffer.from(await file.arrayBuffer())
      const uploaded = await uploadImage(buffer)
      updateData.fotoUrl = uploaded.url
      updateData.fotoPublicId = uploaded.publicId
    }

    const producto = await prisma.producto.update({
      where: { id },
      data: updateData,
      include: { categoria: true },
    })
    return c.json(producto)
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2025') return c.json({ error: 'Producto no encontrado' }, 404)
    console.error(e)
    return c.json({ error: 'Error al actualizar producto' }, 500)
  }
})

admin.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  try {
    const existing = await prisma.producto.findUnique({ where: { id } })
    if (!existing) return c.json({ error: 'Producto no encontrado' }, 404)
    if (existing.fotoPublicId) {
      const { deleteImage } = await import('../lib/cloudinary.js')
      await deleteImage(existing.fotoPublicId).catch(() => {})
    }
    await prisma.producto.delete({ where: { id } })
    return c.json({ ok: true })
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2025') return c.json({ error: 'Producto no encontrado' }, 404)
    return c.json({ error: 'Error al eliminar producto' }, 500)
  }
})

export { admin as productosAdminRoutes }

import { prisma } from '../db.js'
import { ConflictError, NotFoundError } from '../utils/errors.js'
import { uploadImage, deleteImage } from '../lib/cloudinary.js'
import { DtoMapper } from '../utils/dto.js'

export class ProductosService {
  static async getAdminProducts() {
    const productos = await prisma.producto.findMany({
      orderBy: { orden: 'asc' },
      include: { categoria: true },
    })
    return productos.map(DtoMapper.toProductoDTO)
  }

  static async createProduct(data: {
    categoriaId: number
    nombre: string
    descripcion?: string
    precio: number
    precioUnidad?: number
    disponible: boolean
    orden: number
  }, file: File | null) {
    const dup = await prisma.producto.findFirst({ where: { orden: data.orden, categoriaId: data.categoriaId } })
    if (dup) throw new ConflictError(`Ya existe un producto con el orden ${data.orden} en esa categoría`)

    let fotoUrl: string | undefined
    let fotoPublicId: string | undefined

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const uploaded = await uploadImage(buffer)
      fotoUrl = uploaded.url
      fotoPublicId = uploaded.publicId
    }

    const producto = await prisma.producto.create({
      data: {
        ...data,
        fotoUrl,
        fotoPublicId,
      },
      include: { categoria: true },
    })
    return DtoMapper.toProductoDTO(producto)
  }

  static async updateProduct(id: number, data: {
    categoriaId?: number
    nombre?: string
    descripcion?: string
    precio?: number
    precioUnidad?: number
    disponible?: boolean
    orden?: number
  }, file: File | null) {
    if (data.orden !== undefined && data.categoriaId !== undefined) {
      const dup = await prisma.producto.findFirst({ where: { orden: data.orden, categoriaId: data.categoriaId, NOT: { id } } })
      if (dup) throw new ConflictError(`Ya existe un producto con el orden ${data.orden} en esa categoría`)
    }

    const updateData: Record<string, unknown> = { ...data }

    if (file && file.size > 0) {
      const existing = await prisma.producto.findUnique({ where: { id } })
      if (!existing) throw new NotFoundError('Producto no encontrado')
      if (existing.fotoPublicId) {
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
    return DtoMapper.toProductoDTO(producto)
  }

  static async reorderProducts(ordenes: { id: number; orden: number }[]) {
    await Promise.all(
      ordenes.map(({ id, orden }) => prisma.producto.update({ where: { id }, data: { orden } }))
    )
  }

  static async deleteProduct(id: number) {
    const existing = await prisma.producto.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Producto no encontrado')
    if (existing.fotoPublicId) {
      await deleteImage(existing.fotoPublicId).catch(() => {})
    }
    return prisma.producto.delete({ where: { id } })
  }
}

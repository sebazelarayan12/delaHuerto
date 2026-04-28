import { prisma } from '../db.js'
import { ConflictError, NotFoundError } from '../utils/errors.js'
import { DtoMapper } from '../utils/dto.js'

export class CategoriasService {
  static async getPublicCategories() {
    const categorias = await prisma.categoria.findMany({
      where: { activa: true },
      orderBy: { orden: 'asc' },
      include: {
        productos: {
          orderBy: { orden: 'asc' },
        },
      },
    })
    return categorias.map(DtoMapper.toCategoriaDTO)
  }

  static async getAdminCategories() {
    const categorias = await prisma.categoria.findMany({
      orderBy: { orden: 'asc' },
    })
    return categorias.map(DtoMapper.toCategoriaDTO)
  }

  static async createCategory(data: { nombre: string; orden: number; activa: boolean }) {
    const dup = await prisma.categoria.findFirst({ where: { orden: data.orden } })
    if (dup) throw new ConflictError(`Ya existe una categoría con el orden ${data.orden}`)
    const categoria = await prisma.categoria.create({ data })
    return DtoMapper.toCategoriaDTO(categoria)
  }

  static async updateCategory(id: number, data: { nombre?: string; orden?: number; activa?: boolean }) {
    if (data.orden !== undefined) {
      const dup = await prisma.categoria.findFirst({ where: { orden: data.orden, NOT: { id } } })
      if (dup) throw new ConflictError(`Ya existe una categoría con el orden ${data.orden}`)
    }
    const categoria = await prisma.categoria.update({ where: { id }, data })
    return DtoMapper.toCategoriaDTO(categoria)
  }

  static async deleteCategory(id: number) {
    const count = await prisma.producto.count({ where: { categoriaId: id } })
    if (count > 0) throw new ConflictError('La categoría tiene productos. Eliminá los productos primero.')
    return prisma.categoria.delete({ where: { id } })
  }

  static async reorderCategories(ordenes: { id: number; orden: number }[]) {
    await prisma.$transaction(
      ordenes.map((o) => prisma.categoria.update({ where: { id: o.id }, data: { orden: o.orden } }))
    )
  }
}

import { prisma } from '../db.js'
import { ConflictError, NotFoundError } from '../utils/errors.js'
import { DtoMapper } from '../utils/dto.js'

export class CategoriasService {
  static async getPublicCategories() {
    const categorias = await prisma.categoria.findMany({
      where: { activa: true, eliminado: false },
      orderBy: { orden: 'asc' },
      include: {
        productos: {
          where: { disponible: true, eliminado: false },
          orderBy: { orden: 'asc' },
        },
        descuentos: true,
      },
    })
    return categorias.map(DtoMapper.toCategoriaDTO)
  }

  static async getAdminCategories() {
    const categorias = await prisma.categoria.findMany({
      where: { eliminado: false },
      orderBy: { orden: 'asc' },
      include: { descuentos: true },
    })
    return categorias.map(DtoMapper.toCategoriaDTO)
  }

  static async createCategory(data: { nombre: string; orden: number; activa: boolean }) {
    const dup = await prisma.categoria.findFirst({ where: { orden: data.orden, eliminado: false } })
    if (dup) throw new ConflictError(`Ya existe una categoría con el orden ${data.orden}`)
    const categoria = await prisma.categoria.create({ data, include: { descuentos: true } })
    return DtoMapper.toCategoriaDTO(categoria)
  }

  static async updateCategory(id: number, data: { nombre?: string; orden?: number; activa?: boolean }) {
    if (data.orden !== undefined) {
      const dup = await prisma.categoria.findFirst({ where: { orden: data.orden, eliminado: false, NOT: { id } } })
      if (dup) throw new ConflictError(`Ya existe una categoría con el orden ${data.orden}`)
    }
    const categoria = await prisma.categoria.update({ where: { id }, data, include: { descuentos: true } })
    return DtoMapper.toCategoriaDTO(categoria)
  }

  static async deleteCategory(id: number) {
    const categoria = await prisma.categoria.findUnique({ where: { id } })
    if (!categoria) throw new NotFoundError('Categoria no encontrada')

    await prisma.$transaction([
      prisma.producto.updateMany({ where: { categoriaId: id }, data: { eliminado: true } }),
      prisma.categoria.update({ where: { id }, data: { eliminado: true } }),
    ])
  }

  static async reorderCategories(ordenes: { id: number; orden: number }[]) {
    await prisma.$transaction(
      ordenes.map((o) => prisma.categoria.update({ where: { id: o.id }, data: { orden: o.orden } }))
    )
  }

  static async syncDescuentos(
    categoriaId: number,
    tiers: { cantidadMinima: number; porcentaje: number }[]
  ) {
    const existe = await prisma.categoria.findUnique({ where: { id: categoriaId } })
    if (!existe) throw new NotFoundError('Categoría no encontrada')
    await prisma.$transaction([
      prisma.descuentoCategoria.deleteMany({ where: { categoriaId } }),
      ...tiers.map((t) => prisma.descuentoCategoria.create({ data: { categoriaId, ...t } })),
    ])
  }
}

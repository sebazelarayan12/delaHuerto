import { prisma } from '../db.js'
import { NotFoundError } from '../utils/errors.js'
import { DtoMapper } from '../utils/dto.js'

interface CategoriaEgresoInput {
  nombre: string
  activa?: boolean
}

export class CategoriasEgresoService {
  static async getCategorias() {
    const categorias = await prisma.categoriaEgreso.findMany({
      where: { eliminado: false },
      orderBy: { nombre: 'asc' },
    })
    return categorias.map(DtoMapper.toCategoriaEgresoDTO)
  }

  static async createCategoria(data: CategoriaEgresoInput) {
    const categoria = await prisma.categoriaEgreso.create({ data })
    return DtoMapper.toCategoriaEgresoDTO(categoria)
  }

  static async updateCategoria(id: number, data: Partial<CategoriaEgresoInput>) {
    const existe = await prisma.categoriaEgreso.findUnique({ where: { id } })
    if (!existe) throw new NotFoundError('Categoria de egreso no encontrada')
    const categoria = await prisma.categoriaEgreso.update({ where: { id }, data })
    return DtoMapper.toCategoriaEgresoDTO(categoria)
  }

  static async deleteCategoria(id: number) {
    const existe = await prisma.categoriaEgreso.findUnique({ where: { id } })
    if (!existe) throw new NotFoundError('Categoria de egreso no encontrada')
    await prisma.categoriaEgreso.update({ where: { id }, data: { eliminado: true } })
  }
}

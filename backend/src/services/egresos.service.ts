import { prisma } from '../db.js'
import { NotFoundError } from '../utils/errors.js'
import { DtoMapper } from '../utils/dto.js'

interface EgresoInput {
  categoriaId: number
  monto: number
  descripcion?: string
  fecha?: string
}

export class EgresosService {
  static async getEgresos(desde?: string, hasta?: string) {
    const where: { eliminado: boolean; fecha?: { gte?: Date; lte?: Date } } = { eliminado: false }
    if (desde || hasta) {
      where.fecha = {}
      if (desde) where.fecha.gte = new Date(desde)
      if (hasta) {
        const hastaDate = new Date(hasta)
        hastaDate.setHours(23, 59, 59, 999)
        where.fecha.lte = hastaDate
      }
    }

    const egresos = await prisma.egreso.findMany({
      where,
      orderBy: { fecha: 'desc' },
      include: { categoria: true },
    })
    return egresos.map(DtoMapper.toEgresoDTO)
  }

  static async createEgreso(data: EgresoInput) {
    const categoria = await prisma.categoriaEgreso.findUnique({ where: { id: data.categoriaId } })
    if (!categoria) throw new NotFoundError('Categoria de egreso no encontrada')

    const egreso = await prisma.egreso.create({
      data: {
        categoriaId: data.categoriaId,
        monto: data.monto,
        descripcion: data.descripcion,
        ...(data.fecha ? { fecha: new Date(data.fecha) } : {}),
      },
      include: { categoria: true },
    })
    return DtoMapper.toEgresoDTO(egreso)
  }

  static async deleteEgreso(id: number) {
    const egreso = await prisma.egreso.findUnique({ where: { id } })
    if (!egreso) throw new NotFoundError('Egreso no encontrado')
    await prisma.egreso.update({ where: { id }, data: { eliminado: true } })
  }
}

import { prisma } from '../db.js'
import { NotFoundError, HttpError } from '../utils/errors.js'

interface ItemInput {
  productoId: number
  cantidad: number
  precioUnitario: number
}

export class VentasService {
  static async getVentas(desde?: string, hasta?: string) {
    const where: { fecha?: { gte?: Date; lte?: Date } } = {}
    if (desde || hasta) {
      where.fecha = {}
      if (desde) where.fecha.gte = new Date(desde)
      if (hasta) {
        const hastaDate = new Date(hasta)
        hastaDate.setHours(23, 59, 59, 999)
        where.fecha.lte = hastaDate
      }
    }

    return prisma.venta.findMany({
      where,
      orderBy: { fecha: 'desc' },
      include: {
        items: {
          include: {
            producto: { select: { id: true, nombre: true, fotoUrl: true, categoria: { select: { nombre: true } } } },
          },
        },
      },
    })
  }

  static async createVenta(items: ItemInput[], notas?: string, fecha?: string) {
    return prisma.$transaction(async (tx) => {
      const productoIds = items.map((i) => i.productoId)
      const productos = await tx.producto.findMany({
        where: { id: { in: productoIds } },
      })

      for (const item of items) {
        const prod = productos.find((p) => p.id === item.productoId)
        if (!prod) throw new NotFoundError(`Producto ${item.productoId} no encontrado`)
        if (prod.stock < item.cantidad) {
          throw new HttpError(
            409,
            `Stock insuficiente para "${prod.nombre}": disponible ${prod.stock}, requerido ${item.cantidad}`
          )
        }
      }

      const total = items.reduce((acc, i) => acc + i.precioUnitario * i.cantidad, 0)

      const venta = await tx.venta.create({
        data: { total, notas, ...(fecha ? { fecha: new Date(fecha) } : {}) },
      })

      await tx.itemVenta.createMany({
        data: items.map((i) => ({
          ventaId: venta.id,
          productoId: i.productoId,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
        })),
      })

      await Promise.all(
        items.map((i) => {
          const prod = productos.find((p) => p.id === i.productoId)!
          const nuevoStock = prod.stock - i.cantidad
          return tx.producto.update({
            where: { id: i.productoId },
            data: {
              stock: { decrement: i.cantidad },
              ...(nuevoStock <= 0 ? { disponible: false } : {}),
            },
          })
        })
      )

      return tx.venta.findUnique({
        where: { id: venta.id },
        include: {
          items: {
            include: {
              producto: { select: { id: true, nombre: true, fotoUrl: true, categoria: { select: { nombre: true } } } },
            },
          },
        },
      })
    })
  }

  static async deleteVenta(id: number) {
    const venta = await prisma.venta.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!venta) throw new NotFoundError('Venta no encontrada')

    await prisma.$transaction(async (tx) => {
      await Promise.all(
        venta.items.map((item) =>
          tx.producto.update({
            where: { id: item.productoId },
            data: { stock: { increment: item.cantidad }, disponible: true },
          })
        )
      )
      await tx.venta.delete({ where: { id } })
    })
  }
}

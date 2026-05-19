import { prisma } from '../db.js'
import { NotFoundError, HttpError } from '../utils/errors.js'

export class StockService {
  static async getProductsWithStock() {
    const productos = await prisma.producto.findMany({
      where: { eliminado: false },
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        nombre: true,
        precio: true,
        fotoUrl: true,
        disponible: true,
        stock: true,
        stockMinimo: true,
        categoria: { select: { id: true, nombre: true } },
      },
    })
    return productos
  }

  static async adjustStock(productoId: number, cantidad: number, motivo: string) {
    const producto = await prisma.producto.findUnique({ where: { id: productoId } })
    if (!producto) throw new NotFoundError('Producto no encontrado')

    const nuevoStock = producto.stock + cantidad
    if (nuevoStock < 0) {
      throw new HttpError(409, `Stock insuficiente: disponible ${producto.stock}, ajuste ${cantidad}`)
    }

    const disponibleUpdate = nuevoStock <= 0 ? { disponible: false } : { disponible: true }

    const [ajuste] = await prisma.$transaction([
      prisma.ajusteStock.create({
        data: { productoId, cantidad, motivo },
      }),
      prisma.producto.update({
        where: { id: productoId },
        data: { stock: { increment: cantidad }, ...disponibleUpdate },
      }),
    ])
    return ajuste
  }

  static async getHistorial(productoId: number) {
    const producto = await prisma.producto.findUnique({ where: { id: productoId } })
    if (!producto) throw new NotFoundError('Producto no encontrado')

    return prisma.ajusteStock.findMany({
      where: { productoId },
      orderBy: { fecha: 'desc' },
    })
  }
}

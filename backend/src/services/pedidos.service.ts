import { prisma } from '../db.js'
import { HttpError, NotFoundError } from '../utils/errors.js'

interface ItemInput {
  productoId: number
  cantidad: number
  precioUnitario: number
}

interface CreatePedidoInput {
  nombre: string
  telefono?: string
  direccion?: string
  notas?: string
  fechaEntrega?: string
  items: ItemInput[]
  metodoPago?: 'efectivo' | 'transferencia' | 'mercadopago'
  estadoPago?: 'pendiente' | 'pagado'
  mpPaymentId?: string
}

const PEDIDO_INCLUDE = {
  items: {
    include: {
      producto: { select: { id: true, nombre: true, fotoUrl: true } },
    },
  },
} as const

export class PedidosService {
  static async getPedidos() {
    return prisma.pedido.findMany({
      orderBy: { creadoEn: 'desc' },
      include: PEDIDO_INCLUDE,
    })
  }

  static async createPedido(data: CreatePedidoInput) {
    const total = data.items.reduce((acc, i) => acc + i.precioUnitario * i.cantidad, 0)
    const fechaEntregaParseada = data.fechaEntrega ? new Date(data.fechaEntrega) : null
    const fechaEntrega = fechaEntregaParseada && !isNaN(fechaEntregaParseada.getTime()) ? fechaEntregaParseada : new Date()

    const datosBase = {
      nombre: data.nombre,
      telefono: data.telefono ?? null,
      direccion: data.direccion ?? null,
      notas: data.notas ?? null,
      fechaEntrega,
      total,
      metodoPago: data.metodoPago ?? 'efectivo',
      estadoPago: data.estadoPago ?? 'pendiente',
      mpPaymentId: data.mpPaymentId ?? null,
    }

    if (data.estadoPago !== 'pagado') {
      return prisma.pedido.create({
        data: {
          ...datosBase,
          items: { create: data.items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad, precioUnitario: i.precioUnitario })) },
        },
        include: PEDIDO_INCLUDE,
      })
    }

    // Pedido ya pagado (ej. confirmado por webhook de MP): crear pedido, generar venta y
    // descontar stock en una unica transaccion. Si el stock falla, el pedido NUNCA se
    // commitea, evitando que quede un pedido pagado huerfano sin venta asociada.
    return prisma.$transaction(async (tx) => {
      const productoIds = data.items.map((i) => i.productoId)
      const productos = await tx.producto.findMany({ where: { id: { in: productoIds } } })

      for (const item of data.items) {
        const prod = productos.find((p) => p.id === item.productoId)
        if (!prod) throw new NotFoundError(`Producto ${item.productoId} no encontrado`)
        if (prod.stock < item.cantidad) {
          throw new HttpError(409, `Stock insuficiente para "${prod.nombre}": disponible ${prod.stock}, requerido ${item.cantidad}`)
        }
      }

      const venta = await tx.venta.create({ data: { total, notas: data.nombre } })

      await tx.itemVenta.createMany({
        data: data.items.map((i) => ({
          ventaId: venta.id,
          productoId: i.productoId,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
        })),
      })

      await Promise.all(
        data.items.map((item) => {
          const prod = productos.find((p) => p.id === item.productoId)!
          const nuevoStock = prod.stock - item.cantidad
          return tx.producto.update({
            where: { id: item.productoId },
            data: {
              stock: { decrement: item.cantidad },
              ...(nuevoStock <= 0 ? { disponible: false } : {}),
            },
          })
        })
      )

      return tx.pedido.create({
        data: {
          ...datosBase,
          estado: 'por_entregar',
          ventaId: venta.id,
          items: { create: data.items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad, precioUnitario: i.precioUnitario })) },
        },
        include: PEDIDO_INCLUDE,
      })
    })
  }

  static async cambiarEstado(id: number, nuevoEstado: 'por_entregar' | 'entregado' | 'cancelado') {
    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!pedido) throw new NotFoundError('Pedido no encontrado')

    const transicionesValidas: Record<string, string[]> = {
      pendiente: ['por_entregar', 'cancelado'],
      por_entregar: ['entregado'],
    }

    const permitidos = transicionesValidas[pedido.estado] ?? []
    if (!permitidos.includes(nuevoEstado)) {
      throw new HttpError(400, `No se puede pasar de "${pedido.estado}" a "${nuevoEstado}"`)
    }

    if (nuevoEstado === 'por_entregar') {
      return prisma.$transaction(async (tx) => {
        const productoIds = pedido.items.map((i) => i.productoId)
        const productos = await tx.producto.findMany({ where: { id: { in: productoIds } } })

        for (const item of pedido.items) {
          const prod = productos.find((p) => p.id === item.productoId)
          if (!prod) throw new NotFoundError(`Producto ${item.productoId} no encontrado`)
          if (prod.stock < item.cantidad) {
            throw new HttpError(
              409,
              `Stock insuficiente para "${prod.nombre}": disponible ${prod.stock}, requerido ${item.cantidad}`
            )
          }
        }

        const ventaTotal = pedido.items.reduce(
          (acc, i) => acc + Number(i.precioUnitario) * i.cantidad,
          0
        )

        const venta = await tx.venta.create({
          data: { total: ventaTotal, notas: pedido.nombre },
        })

        await tx.itemVenta.createMany({
          data: pedido.items.map((i) => ({
            ventaId: venta.id,
            productoId: i.productoId,
            cantidad: i.cantidad,
            precioUnitario: i.precioUnitario,
          })),
        })

        await Promise.all(
          pedido.items.map((item) => {
            const prod = productos.find((p) => p.id === item.productoId)!
            const nuevoStock = prod.stock - item.cantidad
            return tx.producto.update({
              where: { id: item.productoId },
              data: {
                stock: { decrement: item.cantidad },
                ...(nuevoStock <= 0 ? { disponible: false } : {}),
              },
            })
          })
        )

        return tx.pedido.update({
          where: { id },
          data: { estado: 'por_entregar', ventaId: venta.id },
          include: PEDIDO_INCLUDE,
        })
      })
    }

    return prisma.pedido.update({
      where: { id },
      data: { estado: nuevoEstado },
      include: PEDIDO_INCLUDE,
    })
  }

  static async deletePedido(id: number) {
    const pedido = await prisma.pedido.findUnique({ where: { id } })
    if (!pedido) throw new NotFoundError('Pedido no encontrado')

    if (pedido.estado === 'por_entregar' || pedido.estado === 'entregado') {
      throw new HttpError(400, 'No se puede eliminar un pedido pagado o entregado')
    }

    await prisma.pedido.delete({ where: { id } })
  }

  static async findByMpPaymentId(mpPaymentId: string) {
    return prisma.pedido.findUnique({ where: { mpPaymentId } })
  }
}

import { prisma } from '../db.js'
import { getMpPreferenceClient } from '../lib/mercadopago.js'
import { env } from '../env.js'
import { HttpError, NotFoundError } from '../utils/errors.js'

interface ItemCheckoutInput {
  productoId: number
  cantidad: number
}

interface CrearPreferenceInput {
  nombre: string
  telefono?: string
  direccion?: string
  notas?: string
  fechaEntrega?: string
  items: ItemCheckoutInput[]
}

export class CheckoutService {
  static async crearPreference(input: CrearPreferenceInput): Promise<{ initPoint: string }> {
    if (input.items.length === 0) {
      throw new HttpError(400, 'El carrito esta vacio')
    }

    const productoIds = input.items.map((i) => i.productoId)
    const productos = await prisma.producto.findMany({ where: { id: { in: productoIds } } })

    const mpItems = input.items.map((item) => {
      const producto = productos.find((p) => p.id === item.productoId)
      if (!producto) throw new NotFoundError(`Producto ${item.productoId} no encontrado`)
      if (!producto.disponible) throw new HttpError(409, `"${producto.nombre}" ya no esta disponible`)
      if (producto.stock < item.cantidad) {
        throw new HttpError(409, `Stock insuficiente para "${producto.nombre}": disponible ${producto.stock}, requerido ${item.cantidad}`)
      }

      return {
        id: String(producto.id),
        title: producto.nombre,
        quantity: item.cantidad,
        unit_price: Number(producto.precio),
        currency_id: 'ARS',
      }
    })

    // El precio se congela en la metadata al momento del checkout. El webhook usa este
    // precio (no el precio actual del producto) para que un cambio de precio entre el
    // pago y la llegada del webhook no desalinee lo cobrado por MP con lo registrado.
    const metadata = {
      nombre: input.nombre,
      telefono: input.telefono ?? null,
      direccion: input.direccion ?? null,
      notas: input.notas ?? null,
      fechaEntrega: input.fechaEntrega ?? null,
      items: input.items.map((item) => ({
        producto_id: item.productoId,
        cantidad: item.cantidad,
        precio_unitario: mpItems.find((mi) => mi.id === String(item.productoId))!.unit_price,
      })),
    }

    const mpPreference = await getMpPreferenceClient()
    if (!mpPreference) {
      throw new HttpError(503, 'Pago no disponible, contactar al administrador')
    }

    const result = await mpPreference.create({
      body: {
        items: mpItems,
        metadata,
        back_urls: {
          success: `${env.FRONTEND_URL}/pedido/exito`,
          failure: `${env.FRONTEND_URL}/pedido/error`,
          pending: `${env.FRONTEND_URL}/pedido/pendiente`,
        },
        auto_return: 'approved',
        notification_url: `${env.BACKEND_URL}/api/webhooks/mercadopago`,
      },
    })

    if (!result.init_point) {
      throw new HttpError(502, 'Mercado Pago no devolvio un link de pago')
    }

    return { initPoint: result.init_point }
  }
}

import { prisma } from '../db.js'
import { getMpPreferenceClient } from '../lib/mercadopago.js'
import { env } from '../env.js'
import { HttpError, NotFoundError } from '../utils/errors.js'

interface ItemCheckoutInput {
  productoId: number
  cantidad: number
  modalidad: 'cocinada' | 'congelada'
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
    const productos = await prisma.producto.findMany({
      where: { id: { in: productoIds } },
      include: { categoria: { include: { descuentos: true } } },
    })

    // Un mismo producto puede aparecer en dos lineas del carrito (una cocinada, una
    // congelada) porque la identidad de linea ahora es (productoId, modalidad). Si se
    // valida el stock por linea, cada una individualmente puede pasar aunque la suma
    // supere el stock disponible -- hay que agregar por producto antes de validar.
    const cantidadPorProducto = new Map<number, number>()
    for (const item of input.items) {
      cantidadPorProducto.set(item.productoId, (cantidadPorProducto.get(item.productoId) ?? 0) + item.cantidad)
    }

    // Los descuentos son por categoria (configurados por el admin) y aplican sobre la
    // cantidad total de unidades de esa categoria en el pedido -- igual que en el calculo
    // que ya usa el frontend (menu/helpers/descuentos.helper.ts) para WhatsApp.
    const cantidadPorCategoria = new Map<number, number>()
    for (const item of input.items) {
      const producto = productos.find((p) => p.id === item.productoId)
      if (!producto) continue
      cantidadPorCategoria.set(producto.categoriaId, (cantidadPorCategoria.get(producto.categoriaId) ?? 0) + item.cantidad)
    }

    const descuentoPorCategoria = new Map<number, number>()
    for (const producto of productos) {
      if (descuentoPorCategoria.has(producto.categoriaId)) continue
      const cantidad = cantidadPorCategoria.get(producto.categoriaId) ?? 0
      const tiers = producto.categoria.descuentos
      const aplicable = [...tiers].sort((a, b) => b.cantidadMinima - a.cantidadMinima).find((t) => cantidad >= t.cantidadMinima)
      descuentoPorCategoria.set(producto.categoriaId, aplicable ? aplicable.porcentaje / 100 : 0)
    }

    const mpItems = input.items.map((item) => {
      const producto = productos.find((p) => p.id === item.productoId)
      if (!producto) throw new NotFoundError(`Producto ${item.productoId} no encontrado`)
      if (!producto.disponible) throw new HttpError(409, `"${producto.nombre}" ya no esta disponible`)
      const cantidadTotalProducto = cantidadPorProducto.get(item.productoId)!
      if (producto.stock < cantidadTotalProducto) {
        throw new HttpError(409, `Stock insuficiente para "${producto.nombre}": disponible ${producto.stock}, requerido ${cantidadTotalProducto}`)
      }

      // El precio depende de la modalidad elegida -- congelada es el precio base/obligatorio
      // del producto (precioCongelada), cocinada es la variante opcional (precioCocinada).
      const precioBase = item.modalidad === 'cocinada' ? producto.precioCocinada : producto.precioCongelada
      if (precioBase === null) {
        throw new HttpError(409, `"${producto.nombre}" no tiene precio cocinada configurado`)
      }

      const pctDescuento = descuentoPorCategoria.get(producto.categoriaId) ?? 0
      const unitPrice = Math.round(Number(precioBase) * (1 - pctDescuento) * 100) / 100

      return {
        id: String(producto.id),
        title: producto.nombre,
        description: producto.descripcion ?? undefined,
        picture_url: producto.fotoUrl ?? undefined,
        category_id: 'food',
        quantity: item.cantidad,
        unit_price: unitPrice,
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
      items: input.items.map((item, idx) => ({
        producto_id: item.productoId,
        cantidad: item.cantidad,
        precio_unitario: mpItems[idx].unit_price,
        modalidad: item.modalidad,
      })),
    }

    const mpPreference = await getMpPreferenceClient()
    if (!mpPreference) {
      throw new HttpError(503, 'Pago no disponible, contactar al administrador')
    }

    // Solo se permite pagar con dinero en cuenta de MP o tarjeta de debito -- se excluye
    // tarjeta de credito, efectivo en puntos de pago (ticket) y la linea de credito propia
    // de MP (mercado_credito).
    const result = await mpPreference.create({
      body: {
        items: mpItems,
        metadata,
        payment_methods: {
          excluded_payment_types: [
            { id: 'credit_card' },
            { id: 'ticket' },
            { id: 'mercado_credito' },
          ],
        },
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

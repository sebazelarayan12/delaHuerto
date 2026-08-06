import { z } from 'zod'
import { getMpPaymentClient } from '../lib/mercadopago.js'
import { PedidosService } from './pedidos.service.js'
import { prisma } from '../db.js'

// MP normaliza la metadata a snake_case y a veces la stringifica -> coerce defensivo.
const metadataCheckoutSchema = z.object({
  nombre: z.string().min(1),
  telefono: z.string().nullable().optional(),
  direccion: z.string().nullable().optional(),
  notas: z.string().nullable().optional(),
  fecha_entrega: z.string().nullable().optional(),
  items: z
    .array(
      z.object({
        producto_id: z.coerce.number().int().positive(),
        cantidad: z.coerce.number().int().positive(),
        precio_unitario: z.coerce.number().nonnegative(),
      })
    )
    .min(1),
})

export class MercadoPagoWebhookService {
  static async procesarNotificacion(paymentId: string): Promise<{ procesado: boolean }> {
    const mpPayment = await getMpPaymentClient()
    if (!mpPayment) {
      console.error(`[webhook mercadopago] no hay token de MP disponible (produccion sin cuenta conectada) - no se puede procesar pago ${paymentId}`)
      return { procesado: false }
    }

    const payment = await mpPayment.get({ id: paymentId })

    if (payment.status !== 'approved') {
      console.log(`[webhook mercadopago] pago ${paymentId} con status "${payment.status}" - ignorado`)
      return { procesado: false }
    }

    const yaExiste = await PedidosService.findByMpPaymentId(String(payment.id))
    if (yaExiste) {
      console.log(`[webhook mercadopago] pago ${paymentId} ya proceso previamente - pedido ${yaExiste.id}`)
      return { procesado: true }
    }

    const metadataParseada = metadataCheckoutSchema.safeParse(payment.metadata)
    if (!metadataParseada.success) {
      // Metadata invalida (ej. pago que no vino del checkout propio, link manual) - no hay
      // nada que reintentar, se marca como procesado para que MP no reintente para siempre.
      console.error(`[webhook mercadopago] pago ${paymentId} con metadata invalida, pedido no creado:`, metadataParseada.error.flatten())
      return { procesado: false }
    }
    const metadata = metadataParseada.data

    const productoIds = metadata.items.map((item) => item.producto_id)
    const productos = await prisma.producto.findMany({ where: { id: { in: productoIds } } })

    const items = metadata.items.map((item) => {
      const producto = productos.find((p) => p.id === item.producto_id)
      if (!producto) {
        throw new Error(`Producto ${item.producto_id} no encontrado al procesar pago ${payment.id} - pedido no creado`)
      }
      // Precio congelado en la metadata al momento del checkout, no el precio actual del
      // producto - evita que un cambio de precio entre el pago y el webhook desalinee lo
      // cobrado por MP con lo registrado.
      return {
        productoId: item.producto_id,
        cantidad: item.cantidad,
        precioUnitario: item.precio_unitario,
      }
    })

    const totalCalculado = items.reduce((acc, i) => acc + i.precioUnitario * i.cantidad, 0)
    const montoPagado = Number(payment.transaction_amount ?? 0)
    if (Math.abs(totalCalculado - montoPagado) > 0.01) {
      console.error(
        `[webhook mercadopago] pago ${paymentId}: total calculado (${totalCalculado}) no coincide con transaction_amount de MP (${montoPagado}) - se registra igual, revisar manualmente`
      )
    }

    await PedidosService.createPedido({
      nombre: metadata.nombre,
      telefono: metadata.telefono ?? undefined,
      direccion: metadata.direccion ?? undefined,
      notas: metadata.notas ?? undefined,
      fechaEntrega: metadata.fecha_entrega ?? undefined,
      items,
      metodoPago: 'mercadopago',
      estadoPago: 'pagado',
      mpPaymentId: String(payment.id),
    })

    console.log(`[webhook mercadopago] pedido creado para pago ${paymentId}`)
    return { procesado: true }
  }
}

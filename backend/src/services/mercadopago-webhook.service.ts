import { mpPayment } from '../lib/mercadopago.js'
import { PedidosService } from './pedidos.service.js'
import { prisma } from '../db.js'

interface MetadataCheckout {
  nombre: string
  telefono: string | null
  direccion: string | null
  notas: string | null
  fecha_entrega: string | null
  items: Array<{ producto_id: number; cantidad: number }>
}

export class MercadoPagoWebhookService {
  static async procesarNotificacion(paymentId: string): Promise<{ procesado: boolean }> {
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

    const metadata = payment.metadata as unknown as MetadataCheckout

    const productoIds = metadata.items.map((item) => item.producto_id)
    const productos = await prisma.producto.findMany({ where: { id: { in: productoIds } } })

    const items = metadata.items.map((item) => {
      const producto = productos.find((p) => p.id === item.producto_id)
      if (!producto) {
        throw new Error(`Producto ${item.producto_id} no encontrado al procesar pago ${payment.id} - pedido no creado`)
      }
      return {
        productoId: item.producto_id,
        cantidad: item.cantidad,
        precioUnitario: Number(producto.precio),
      }
    })

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

import { mpPayment } from '../lib/mercadopago.js'
import { PedidosService } from './pedidos.service.js'

interface MetadataCheckout {
  nombre: string
  telefono: string | null
  direccion: string | null
  notas: string | null
  fechaEntrega: string | null
  items: Array<{ productoId: number; cantidad: number }>
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
    const additionalInfo = payment.additional_info?.items ?? []

    const items = metadata.items.map((item) => {
      const infoItem = additionalInfo.find((i) => i.id === String(item.productoId))
      const precioUnitario = infoItem?.unit_price ? Number(infoItem.unit_price) : 0
      return {
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioUnitario,
      }
    })

    await PedidosService.createPedido({
      nombre: metadata.nombre,
      telefono: metadata.telefono ?? undefined,
      direccion: metadata.direccion ?? undefined,
      notas: metadata.notas ?? undefined,
      fechaEntrega: metadata.fechaEntrega ?? undefined,
      items,
      metodoPago: 'mercadopago',
      estadoPago: 'pagado',
      mpPaymentId: String(payment.id),
    })

    console.log(`[webhook mercadopago] pedido creado para pago ${paymentId}`)
    return { procesado: true }
  }
}

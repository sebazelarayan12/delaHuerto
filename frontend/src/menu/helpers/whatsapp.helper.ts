import { config } from '../../config/env'
import type { ItemCarrito } from '../hooks/useCarrito'

interface DatosPedido {
  readonly nombre: string
  readonly telefono: string
  readonly direccion: string
  readonly metodoPago: 'efectivo' | 'transferencia'
  readonly notas?: string
  readonly fechaEntrega: string
}

interface TotalesPedido {
  readonly subtotal: number
  readonly montoDescuento: number
  readonly total: number
}

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

export function enviarPedidoWhatsApp(items: ItemCarrito[], datos: DatosPedido, totales: TotalesPedido) {
  const { subtotal, montoDescuento, total } = totales
  const lines: string[] = [
    '🥟 *Pedido de Empanadas*',
    '',
    '📋 *Detalle del pedido:*',
  ]

  for (const item of items) {
    const modalidadLabel = item.modalidad === 'cocinada' ? 'Cocinada' : 'Congelada'
    lines.push(`• ${item.cantidad} unidad${item.cantidad !== 1 ? 'es' : ''} de ${item.nombre} (${modalidadLabel}) — ${fmt(item.precio * item.cantidad)}`)
  }

  lines.push('')
  if (montoDescuento > 0) {
    lines.push(`Subtotal: ${fmt(subtotal)}`)
    lines.push(`Descuento: -${fmt(montoDescuento)}`)
  }
  lines.push(`💰 *Total: ${fmt(total)}*`)
  lines.push('')
  lines.push('👤 *Datos del cliente:*')
  lines.push(`Nombre: ${datos.nombre}`)
  lines.push(`Teléfono: ${datos.telefono}`)
  lines.push(`Dirección: ${datos.direccion}`)
  lines.push(`Fecha de entrega: ${datos.fechaEntrega}`)
  lines.push('')
  lines.push(`💳 *Forma de pago:* ${datos.metodoPago === 'efectivo' ? 'Efectivo' : 'Transferencia'}`)

  if (datos.notas?.trim()) {
    lines.push('')
    lines.push(`📝 *Notas:* ${datos.notas}`)
  }

  const mensaje = encodeURIComponent(lines.join('\n'))
  const phone = config.whatsappNumber.replace('+', '')
  window.open(`https://wa.me/${phone}?text=${mensaje}`, '_blank')
}

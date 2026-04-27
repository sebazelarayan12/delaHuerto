import { config } from '../../config/env'
import type { ItemCarrito } from '../hooks/useCarrito'

interface DatosPedido {
  nombre: string
  telefono: string
  direccion: string
  metodoPago: 'efectivo' | 'transferencia'
  notas?: string
}

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

export function enviarPedidoWhatsApp(items: ItemCarrito[], datos: DatosPedido) {
  const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0)
  const lines: string[] = [
    '🫔 *Pedido de Empanadas*',
    '',
    '📋 *Detalle del pedido:*',
  ]

  for (const item of items) {
    lines.push(`• ${item.cantidad} docena${item.cantidad !== 1 ? 's' : ''} de ${item.nombre} — ${fmt(item.precio * item.cantidad)}`)
  }

  lines.push('')
  lines.push(`💰 *Total: ${fmt(total)}*`)
  lines.push('')
  lines.push('👤 *Datos del cliente:*')
  lines.push(`Nombre: ${datos.nombre}`)
  lines.push(`Teléfono: ${datos.telefono}`)
  lines.push(`Dirección: ${datos.direccion}`)
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

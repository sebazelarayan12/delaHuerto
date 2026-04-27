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
  const subtotalLocal = items.reduce((s, i) => s + i.precio * i.cantidad, 0)
  const cantidadTotal = items.reduce((s, i) => s + i.cantidad, 0)
  let porc = 0
  if (cantidadTotal >= 10) porc = 0.25
  else if (cantidadTotal >= 5) porc = 0.05
  const desc = subtotalLocal * porc
  const total = subtotalLocal - desc
  const lines: string[] = [
    '🥟 *Pedido de Empanadas*',
    '',
    '📋 *Detalle del pedido:*',
  ]

  for (const item of items) {
    lines.push(`• ${item.cantidad} docena${item.cantidad !== 1 ? 's' : ''} de ${item.nombre} — ${fmt(item.precio * item.cantidad)}`)
  }

  lines.push('')
  if (desc > 0) {
    lines.push(`Subtotal: ${fmt(subtotalLocal)}`)
    lines.push(`Descuento (${porc * 100}%): -${fmt(desc)}`)
  }
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

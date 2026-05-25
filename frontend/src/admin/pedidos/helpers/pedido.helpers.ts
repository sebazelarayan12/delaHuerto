export const ESTADO_META = {
  pendiente:    { label: 'Pendiente',    bg: '#FBF1D8', text: '#D4920A', border: '#F0DDA8' },
  por_entregar: { label: 'Por entregar', bg: '#E8F5E9', text: '#2E7D32', border: '#C8E6C9' },
  entregado:    { label: 'Entregado',    bg: '#E8F5E9', text: '#2E7D32', border: '#C8E6C9' },
  cancelado:    { label: 'Cancelado',    bg: '#F5F5F5', text: '#757575', border: '#E0E0E0' },
} as const

export type EstadoPedido = keyof typeof ESTADO_META

export function fmtPedidoDate(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  if (d.toDateString() === today.toDateString()) return `Hoy · ${hh}:${mm}`
  if (d.toDateString() === yesterday.toDateString()) return `Ayer · ${hh}:${mm}`
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} · ${hh}:${mm}`
}

export function fmtDeliveryDate(ymd: string): string {
  if (!ymd) return ''
  const [y, m, d] = ymd.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const DAYS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
  const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  if (date.getTime() === today.getTime()) return 'Hoy'
  if (date.getTime() === tomorrow.getTime()) return 'Manana'
  return `${DAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`
}

export function toYMD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function jsDayToIdx(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1
}

const DAY_LABELS_FULL = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo']
const DAY_LABELS_SHORT = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']

export function getDeliveryDayWarning(ymd: string, deliveryDays: boolean[]): string {
  if (!ymd || deliveryDays.length !== 7) return ''
  const [y, m, d] = ymd.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const idx = jsDayToIdx(date.getDay())
  if (!deliveryDays[idx]) {
    return `No se entrega los ${DAY_LABELS_FULL[idx].toLowerCase()}. Elegi otro dia.`
  }
  return ''
}

export function getEnabledDaysHint(deliveryDays: boolean[]): string {
  if (deliveryDays.length !== 7) return ''
  return deliveryDays.map((on, i) => (on ? DAY_LABELS_SHORT[i] : null)).filter(Boolean).join(' · ')
}

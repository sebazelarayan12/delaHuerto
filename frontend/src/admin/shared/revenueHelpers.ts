import type { VentaAdmin } from '../ventas/hooks/useVentas'

export function getDailyRevenue(ventas: VentaAdmin[], days: number): number[] {
  const today = new Date()
  return Array.from({ length: days }, (_, i) => {
    const d = days - 1 - i
    const start = new Date(today)
    start.setDate(today.getDate() - d)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setHours(23, 59, 59, 999)
    return ventas
      .filter((v) => { const f = new Date(v.fecha); return f >= start && f <= end })
      .reduce((s, v) => s + parseFloat(v.total), 0)
  })
}

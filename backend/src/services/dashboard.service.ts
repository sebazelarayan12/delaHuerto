import { prisma } from '../db.js'

interface ProductoStockAlerta {
  id: number
  nombre: string
  stock: number
  stock_minimo: number
  foto_url: string | null
}

interface PeriodTotals {
  hoy: number
  semana: number
  mes: number
  total: number
}

interface DailySeries {
  ventas: number[]
  egresos: number[]
  neto: number[]
}

export class DashboardService {
  static async getSummary() {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const inicioSemana = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)

    const [
      resHoy, resSemana, resMes, resTotal,
      egHoy, egSemana, egMes, egTotal,
      alertas,
      dailySeries,
    ] = await Promise.all([
      prisma.venta.aggregate({ _sum: { total: true }, _count: true, where: { fecha: { gte: hoy } } }),
      prisma.venta.aggregate({ _sum: { total: true }, _count: true, where: { fecha: { gte: inicioSemana } } }),
      prisma.venta.aggregate({ _sum: { total: true }, _count: true, where: { fecha: { gte: inicioMes } } }),
      prisma.venta.aggregate({ _sum: { total: true }, _count: true }),
      prisma.egreso.aggregate({ _sum: { monto: true }, where: { eliminado: false, fecha: { gte: hoy } } }),
      prisma.egreso.aggregate({ _sum: { monto: true }, where: { eliminado: false, fecha: { gte: inicioSemana } } }),
      prisma.egreso.aggregate({ _sum: { monto: true }, where: { eliminado: false, fecha: { gte: inicioMes } } }),
      prisma.egreso.aggregate({ _sum: { monto: true }, where: { eliminado: false } }),
      prisma.$queryRaw<ProductoStockAlerta[]>`
        SELECT id, nombre, stock, stock_minimo, foto_url
        FROM productos
        WHERE stock_minimo > 0 AND stock <= stock_minimo AND eliminado = false
        ORDER BY (stock_minimo - stock) DESC
      `,
      DashboardService.getDailySeries(14),
    ])

    const revenue: PeriodTotals = {
      hoy: Number(resHoy._sum.total ?? 0),
      semana: Number(resSemana._sum.total ?? 0),
      mes: Number(resMes._sum.total ?? 0),
      total: Number(resTotal._sum.total ?? 0),
    }
    const egresos: PeriodTotals = {
      hoy: Number(egHoy._sum.monto ?? 0),
      semana: Number(egSemana._sum.monto ?? 0),
      mes: Number(egMes._sum.monto ?? 0),
      total: Number(egTotal._sum.monto ?? 0),
    }
    const neto: PeriodTotals = {
      hoy: revenue.hoy - egresos.hoy,
      semana: revenue.semana - egresos.semana,
      mes: revenue.mes - egresos.mes,
      total: revenue.total - egresos.total,
    }

    return {
      revenue,
      egresos,
      neto,
      ventas: {
        hoy: resHoy._count,
        semana: resSemana._count,
        mes: resMes._count,
        total: resTotal._count,
      },
      dailySeries,
      stockAlertas: alertas.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        stock: p.stock,
        stockMinimo: p.stock_minimo,
        fotoUrl: p.foto_url,
      })),
    }
  }

  private static async getDailySeries(days: number): Promise<DailySeries> {
    const today = new Date()
    const buckets = Array.from({ length: days }, (_, i) => {
      const d = days - 1 - i
      const start = new Date(today)
      start.setDate(today.getDate() - d)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    })

    const [ventasPorDia, egresosPorDia] = await Promise.all([
      Promise.all(
        buckets.map(({ start, end }) =>
          prisma.venta.aggregate({ _sum: { total: true }, where: { fecha: { gte: start, lte: end } } })
        )
      ),
      Promise.all(
        buckets.map(({ start, end }) =>
          prisma.egreso.aggregate({
            _sum: { monto: true },
            where: { eliminado: false, fecha: { gte: start, lte: end } },
          })
        )
      ),
    ])

    const ventas = ventasPorDia.map((r) => Number(r._sum.total ?? 0))
    const egresos = egresosPorDia.map((r) => Number(r._sum.monto ?? 0))
    const neto = ventas.map((v, i) => v - egresos[i])

    return { ventas, egresos, neto }
  }
}

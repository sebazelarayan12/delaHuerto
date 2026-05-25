import { prisma } from '../db.js'

interface ProductoStockAlerta {
  id: number
  nombre: string
  stock: number
  stock_minimo: number
  foto_url: string | null
}

export class DashboardService {
  static async getSummary() {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const inicioSemana = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)

    const [resHoy, resSemana, resMes, resTotal, alertas] = await Promise.all([
      prisma.venta.aggregate({
        _sum: { total: true },
        _count: true,
        where: { fecha: { gte: hoy } },
      }),
      prisma.venta.aggregate({
        _sum: { total: true },
        _count: true,
        where: { fecha: { gte: inicioSemana } },
      }),
      prisma.venta.aggregate({
        _sum: { total: true },
        _count: true,
        where: { fecha: { gte: inicioMes } },
      }),
      prisma.venta.aggregate({
        _sum: { total: true },
        _count: true,
      }),
      prisma.$queryRaw<ProductoStockAlerta[]>`
        SELECT id, nombre, stock, stock_minimo, foto_url
        FROM productos
        WHERE stock_minimo > 0 AND stock <= stock_minimo AND eliminado = false
        ORDER BY (stock_minimo - stock) DESC
      `,
    ])

    return {
      revenue: {
        hoy: Number(resHoy._sum.total ?? 0),
        semana: Number(resSemana._sum.total ?? 0),
        mes: Number(resMes._sum.total ?? 0),
        total: Number(resTotal._sum.total ?? 0),
      },
      ventas: {
        hoy: resHoy._count,
        semana: resSemana._count,
        mes: resMes._count,
        total: resTotal._count,
      },
      stockAlertas: alertas.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        stock: p.stock,
        stockMinimo: p.stock_minimo,
        fotoUrl: p.foto_url,
      })),
    }
  }
}

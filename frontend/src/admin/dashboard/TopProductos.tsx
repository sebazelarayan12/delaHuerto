import { useMemo } from 'react'
import type { VentaAdmin } from '../ventas/hooks/useVentas'

const MEDAL_BG = ['#D4920A', '#9A7A66', '#C4522A', '#F3E8D8', '#F3E8D8']
const MEDAL_FG = ['#fff', '#fff', '#fff', '#9A7A66', '#9A7A66']
const BAR_FILL = [
  'linear-gradient(90deg, #D4920A, #E8A838)',
  'linear-gradient(90deg, #9A7A66, #B89A88)',
  'linear-gradient(90deg, #C4522A, #E0703F)',
  '#E2CFB5',
  '#E2CFB5',
]

const fmtARS = (n: number) => '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 0 })

interface TopItem {
  id: number
  nombre: string
  fotoUrl: string | null
  qty: number
  revenue: number
}

interface TopProductosProps {
  ventas: VentaAdmin[]
}

export function TopProductos({ ventas }: TopProductosProps) {
  const treintaDias = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const items: TopItem[] = useMemo(() => {
    const map = new Map<number, TopItem>()
    for (const venta of ventas) {
      if (new Date(venta.fecha) < treintaDias) continue
      for (const item of venta.items) {
        const qty = item.cantidad
        const revenue = qty * parseFloat(item.precioUnitario)
        const existing = map.get(item.productoId)
        if (existing) {
          existing.qty += qty
          existing.revenue += revenue
        } else {
          map.set(item.productoId, {
            id: item.productoId,
            nombre: item.producto.nombre,
            fotoUrl: item.producto.fotoUrl,
            qty,
            revenue,
          })
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 5)
  }, [ventas, treintaDias])

  const topQty = items[0]?.qty ?? 1

  return (
    <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(44,18,8,0.06)] overflow-hidden">
      <div className="px-5 py-4 border-b border-sand flex items-center justify-between">
        <div className="font-display text-[18px] font-extrabold text-espresso">Top productos</div>
        <div className="text-xs text-muted">Ultimos 30 dias</div>
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-muted">
          Aun no hay ventas registradas
        </div>
      ) : (
        <div className="px-5 py-4 flex flex-col gap-4">
          {items.map((item, i) => (
            <div key={item.id}>
              <div className="flex items-center gap-3 mb-1.5">
                <div
                  className="flex items-center justify-center shrink-0 rounded-full text-xs font-bold font-sans"
                  style={{ width: 28, height: 28, background: MEDAL_BG[i], color: MEDAL_FG[i] }}
                >
                  {i + 1}
                </div>

                <div className="w-9 h-9 rounded-lg bg-sand flex items-center justify-center shrink-0 overflow-hidden">
                  {item.fotoUrl
                    ? <img src={item.fotoUrl} alt={item.nombre} className="w-full h-full object-cover" />
                    : <span className="icon text-[20px] text-muted">lunch_dining</span>}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-espresso truncate">{item.nombre}</div>
                </div>

                <div className="text-right shrink-0">
                  <div className="flex items-baseline gap-1 justify-end">
                    <span className="font-display font-extrabold text-terra" style={{ fontSize: 17 }}>{item.qty}</span>
                    <span className="text-xs text-muted">uds</span>
                  </div>
                  <div className="text-muted" style={{ fontSize: 11.5 }}>{fmtARS(item.revenue)}</div>
                </div>
              </div>

              <div className="h-[5px] bg-sand rounded-[99px] overflow-hidden">
                <div
                  className="h-full rounded-[99px]"
                  style={{
                    width: `${(item.qty / topQty) * 100}%`,
                    background: BAR_FILL[i],
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

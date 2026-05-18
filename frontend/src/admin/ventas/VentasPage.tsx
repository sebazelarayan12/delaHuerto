import { useState } from 'react'
import AdminLayout from '../AdminLayout'
import { useVentas } from './hooks/useVentas'
import VentaForm from './VentaForm'
import type { VentaAdmin, ItemVentaInput } from './hooks/useVentas'

const fmt = (n: number | string) => '$' + parseFloat(String(n)).toLocaleString('es-AR', { minimumFractionDigits: 0 })

const fmtFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

interface RevenueCardProps {
  label: string
  revenue: number
  count: number
  barClass: string
  textClass: string
}

function RevenueCard({ label, revenue, count, barClass, textClass }: RevenueCardProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-[0_2px_8px_rgba(44,18,8,0.06)] relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${barClass}`} />
      <div className="text-xs font-semibold text-muted uppercase tracking-[0.06em] mb-1">{label}</div>
      <div className={`font-display text-[22px] font-extrabold ${textClass}`}>{fmt(revenue)}</div>
      <div className="text-xs text-muted mt-0.5">{count} {count === 1 ? 'venta' : 'ventas'}</div>
    </div>
  )
}

export default function VentasPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const { query, registrar, cancelar } = useVentas(desde || undefined, hasta || undefined)
  const ventas = query.data ?? []

  const handleRegistrar = (items: ItemVentaInput[], notas?: string, fecha?: string) => {
    registrar.mutate({ items, notas, fecha }, { onSuccess: () => setFormOpen(false) })
  }

  const handleCancelar = (id: number) => {
    cancelar.mutate(id, { onSuccess: () => setConfirmDelete(null) })
  }

  // Revenue calculado desde los datos ya cargados (sin query separada al dashboard)
  const ahora = new Date()
  const hoyInicio = new Date(ahora); hoyInicio.setHours(0, 0, 0, 0)
  const semanaInicio = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000)
  const mesInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1)

  // Para el resumen usamos la query sin filtros de fecha (siempre con todos los datos)
  const { query: queryTodas } = useVentas()
  const todas = queryTodas.data ?? []

  const revenueHoy = todas.filter((v) => new Date(v.fecha) >= hoyInicio).reduce((s, v) => s + parseFloat(v.total), 0)
  const revenueSemana = todas.filter((v) => new Date(v.fecha) >= semanaInicio).reduce((s, v) => s + parseFloat(v.total), 0)
  const revenueMes = todas.filter((v) => new Date(v.fecha) >= mesInicio).reduce((s, v) => s + parseFloat(v.total), 0)
  const revenueTotal = todas.reduce((s, v) => s + parseFloat(v.total), 0)

  const countHoy = todas.filter((v) => new Date(v.fecha) >= hoyInicio).length
  const countSemana = todas.filter((v) => new Date(v.fecha) >= semanaInicio).length
  const countMes = todas.filter((v) => new Date(v.fecha) >= mesInicio).length

  const REVENUE_CARDS = [
    { label: 'Hoy', revenue: revenueHoy, count: countHoy, barClass: 'bg-terra', textClass: 'text-terra' },
    { label: 'Esta semana', revenue: revenueSemana, count: countSemana, barClass: 'bg-gold', textClass: 'text-gold' },
    { label: 'Este mes', revenue: revenueMes, count: countMes, barClass: 'bg-brown', textClass: 'text-brown' },
    { label: 'Total', revenue: revenueTotal, count: todas.length, barClass: 'bg-[#5A8A5A]', textClass: 'text-[#5A8A5A]' },
  ]

  const exportCSV = () => {
    const rows = [
      ['Fecha', 'ID Venta', 'Producto', 'Cantidad', 'Precio unit.', 'Subtotal', 'Total venta', 'Notas'],
      ...todas.flatMap((v) =>
        v.items.map((i) => [
          fmtFecha(v.fecha),
          v.id,
          i.producto.nombre,
          i.cantidad,
          parseFloat(i.precioUnitario).toFixed(2),
          (i.cantidad * parseFloat(i.precioUnitario)).toFixed(2),
          parseFloat(v.total).toFixed(2),
          v.notas ?? '',
        ])
      ),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'ventas.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AdminLayout>
      <div>
        <div className="px-4 lg:px-8 pt-6 lg:pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sand-deep pb-5">
          <div>
            <h1 className="text-[22px] font-extrabold text-espresso">Ventas</h1>
            <p className="text-sm text-muted mt-1">Registra ventas y controla tus ganancias.</p>
          </div>
          <button
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-2 bg-terra text-white px-4 py-2.5 rounded-[10px] border-none font-sans text-sm font-semibold cursor-pointer shadow-[0_2px_8px_rgba(196,82,42,0.3)] hover:bg-terra-dark transition-colors self-start sm:self-auto"
          >
            <span className="icon icon-fill text-[18px]">point_of_sale</span>
            Registrar venta
          </button>
        </div>

        <div className="px-4 lg:px-8 py-6 flex flex-col gap-5">
          {/* Revenue cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {REVENUE_CARDS.map((c) => (
              <RevenueCard key={c.label} {...c} />
            ))}
          </div>

          {/* Historial */}
          <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(44,18,8,0.06)] overflow-hidden">
            <div className="px-5 py-4 border-b border-sand flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <span className="font-bold text-[15px]">Historial de ventas</span>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  className="px-3 py-1.5 border-[1.5px] border-sand-deep rounded-lg text-sm font-sans text-espresso bg-cream outline-none focus:border-terra"
                />
                <span className="text-xs text-muted">hasta</span>
                <input
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  className="px-3 py-1.5 border-[1.5px] border-sand-deep rounded-lg text-sm font-sans text-espresso bg-cream outline-none focus:border-terra"
                />
                {(desde || hasta) && (
                  <button onClick={() => { setDesde(''); setHasta('') }} className="text-xs text-terra underline bg-transparent border-none cursor-pointer">
                    Limpiar
                  </button>
                )}
                <button
                  onClick={exportCSV}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brown border-[1.5px] border-sand-deep rounded-lg px-2.5 py-1.5 bg-transparent cursor-pointer hover:bg-sand"
                >
                  <span className="icon text-[14px]">download</span>
                  CSV
                </button>
              </div>
            </div>

            {query.isLoading ? (
              <div className="text-center py-10 text-muted text-sm">Cargando…</div>
            ) : ventas.length === 0 ? (
              <div className="text-center py-10 text-muted text-sm flex flex-col items-center gap-2">
                <span className="icon icon-fill text-[36px] text-sand-deep">point_of_sale</span>
                Sin ventas registradas
              </div>
            ) : (
              <div className="divide-y divide-sand">
                {ventas.map((v) => (
                  <VentaRow
                    key={v.id}
                    venta={v}
                    onCancelar={() => setConfirmDelete(v.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {formOpen && (
        <VentaForm
          onClose={() => setFormOpen(false)}
          onSave={handleRegistrar}
          loading={registrar.isPending}
        />
      )}

      {confirmDelete !== null && (
        <ConfirmDeleteModal
          onConfirm={() => handleCancelar(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
          loading={cancelar.isPending}
        />
      )}
    </AdminLayout>
  )
}

function VentaRow({ venta, onCancelar }: { venta: VentaAdmin; onCancelar: () => void }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div>
      <div className="flex items-center gap-3 px-5 py-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="bg-transparent border-none cursor-pointer text-muted p-0"
        >
          <span className="icon text-[18px]">{expanded ? 'expand_less' : 'expand_more'}</span>
        </button>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-espresso">{fmtFecha(venta.fecha)}</div>
          <div className="text-xs text-muted">
            {venta.items.length} {venta.items.length === 1 ? 'producto' : 'productos'}
            {venta.notas ? ` · ${venta.notas}` : ''}
          </div>
        </div>

        <span className="font-display text-[18px] font-extrabold text-terra shrink-0">{fmt(venta.total)}</span>

        <button
          onClick={onCancelar}
          className="size-8 flex items-center justify-center rounded-lg border-[1.5px] border-red-200 bg-transparent cursor-pointer text-red-600 hover:bg-red-50 shrink-0"
          title="Cancelar venta"
        >
          <span className="icon text-[16px]">delete</span>
        </button>
      </div>

      {expanded && (
        <div className="px-5 pb-3 pl-12">
          <div className="bg-sand/40 rounded-xl overflow-hidden">
            {venta.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-sand last:border-0">
                <div className="flex-1 text-sm text-espresso font-semibold">{item.producto.nombre}</div>
                <div className="text-xs text-muted">x{item.cantidad}</div>
                <div className="text-xs text-muted">{fmt(item.precioUnitario)} c/u</div>
                <div className="text-sm font-bold text-brown">
                  {fmt(item.cantidad * parseFloat(item.precioUnitario))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ConfirmDeleteModal({ onConfirm, onCancel, loading }: { onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <div
      className="fixed inset-0 bg-espresso/50 z-50 flex items-center justify-center p-5 font-sans"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
      onKeyDown={(e) => { if (e.key === 'Escape') onCancel() }}
    >
      <div className="bg-white rounded-[18px] w-full max-w-[380px] shadow-[0_20px_60px_rgba(44,18,8,0.2)] p-6 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="icon icon-fill text-[28px] text-red-600 shrink-0">warning</span>
          <div>
            <h3 className="text-base font-extrabold text-espresso">Cancelar venta</h3>
            <p className="text-sm text-muted mt-1">Esta accion restaura el stock de todos los productos de la venta y no se puede deshacer.</p>
          </div>
        </div>
        <div className="flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-[10px] border-[1.5px] border-sand-deep bg-transparent font-sans text-sm font-semibold text-brown cursor-pointer hover:bg-sand"
          >
            Volver
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2.5 rounded-[10px] border-none font-sans text-sm font-semibold text-white flex items-center gap-1.5 cursor-pointer ${loading ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
          >
            <span className="icon text-[17px]">delete</span>
            Cancelar venta
          </button>
        </div>
      </div>
    </div>
  )
}

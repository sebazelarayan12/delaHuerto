import { useState } from 'react'
import Pagination from '../../shared/components/Pagination'
import { ESTADO_META, fmtPedidoDate, fmtDeliveryDate } from './helpers/pedido.helpers'
import type { PedidoAdmin } from './hooks/usePedidos'

const PAGE_SIZE = 10

const fmt = (n: number | string) =>
  '$' + parseFloat(String(n)).toLocaleString('es-AR', { minimumFractionDigits: 0 })

interface HistorialSectionProps {
  historial: PedidoAdmin[]
  onEliminar: (id: number) => void
}

export default function HistorialSection({ historial, onEliminar }: HistorialSectionProps) {
  const [open, setOpen] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [page, setPage] = useState(1)

  const filtrado =
    busqueda.trim() === ''
      ? historial
      : historial.filter((p) => {
          const q = busqueda.toLowerCase()
          return (
            p.nombre.toLowerCase().includes(q) ||
            (p.telefono ?? '').toLowerCase().includes(q)
          )
        })

  const totalPages = Math.ceil(filtrado.length / PAGE_SIZE)
  const paginado = filtrado.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between border-none cursor-pointer font-sans rounded-[10px] px-4 py-3"
        style={{ background: '#F3E8D8' }}
      >
        <span className="flex items-center gap-[10px]">
          <span className="font-display font-extrabold text-[16px] text-espresso">Historial</span>
          <span className="text-[12px] font-semibold text-muted">
            {historial.length} {historial.length === 1 ? 'pedido' : 'pedidos'}
          </span>
        </span>
        <span className="icon text-brown" style={{ fontSize: 22 }}>
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-3">
          <div className="relative">
            <span
              className="icon absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              style={{ fontSize: 18 }}
            >
              search
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre o telefono..."
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-3 py-2 text-sm font-medium text-espresso bg-white rounded-[10px] border border-sand-deep outline-none focus:border-terra transition-colors placeholder:text-muted/60"
            />
          </div>

          {filtrado.length === 0 ? (
            <div
              className="py-6 text-center text-sm font-medium text-muted bg-white"
              style={{ border: '1.5px solid #F3E8D8', borderRadius: 12 }}
            >
              {busqueda.trim() !== ''
                ? 'No se encontraron pedidos'
                : 'Aun no hay pedidos en el historial'}
            </div>
          ) : (
            <>
              <div
                className="overflow-x-auto bg-[#FFFDF9]"
                style={{ borderRadius: 18, border: '1.5px solid #F3E8D8' }}
              >
                <table className="w-full border-collapse text-sm">
                  <thead style={{ background: '#F3E8D8' }}>
                    <tr>
                      {['Cliente', 'Items', 'Total', 'Estado', 'Entrega', 'Fecha', ''].map((h) => (
                        <th
                          key={h}
                          className="text-left whitespace-nowrap"
                          style={{ padding: '14px 18px', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#7A4020' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginado.map((p) => {
                      const meta = ESTADO_META[p.estado]
                      const itemSummary = p.items
                        .map((it) => `${it.cantidad}x ${it.producto.nombre}`)
                        .join(', ')
                      const deliveryYmd = p.fechaEntrega ? p.fechaEntrega.split('T')[0] : ''
                      return (
                        <tr
                          key={p.id}
                          className="transition-colors hover:bg-cream"
                          style={{ borderTop: '1px solid #F3E8D8' }}
                        >
                          <td style={{ padding: '14px 18px', color: '#2C1208', verticalAlign: 'middle' }}>
                            <span className="font-bold text-[14px]">{p.nombre}</span>
                          </td>
                          <td style={{ padding: '14px 18px', color: '#2C1208', verticalAlign: 'middle' }}>
                            <span
                              className="text-[13px] inline-block max-w-[260px] overflow-hidden text-ellipsis whitespace-nowrap"
                              style={{ color: '#7A4020' }}
                              title={itemSummary}
                            >
                              {itemSummary}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px', color: '#2C1208', verticalAlign: 'middle' }}>
                            <span className="font-bold">{fmt(p.total)}</span>
                          </td>
                          <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                            <span
                              className="px-[10px] py-[3px] rounded-full text-[12px] font-bold inline-flex items-center gap-1"
                              style={{ background: meta.bg, color: meta.text, border: `1px solid ${meta.border}` }}
                            >
                              {meta.label}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                            {deliveryYmd ? (
                              <span className="text-[12.5px] font-bold" style={{ color: '#A0401E' }}>
                                {fmtDeliveryDate(deliveryYmd)}
                              </span>
                            ) : (
                              <span className="text-[12.5px] text-muted">-</span>
                            )}
                          </td>
                          <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                            <span className="text-[12.5px] font-semibold text-muted">
                              {fmtPedidoDate(p.creadoEn)}
                            </span>
                          </td>
                          <td style={{ padding: '10px 18px', verticalAlign: 'middle' }}>
                            {p.estado === 'cancelado' && (
                              <button
                                onClick={() => onEliminar(p.id)}
                                className="inline-flex items-center justify-center size-8 rounded-lg border border-red-200 bg-red-50 text-red-600 cursor-pointer transition-colors hover:bg-red-100"
                                title="Eliminar pedido"
                              >
                                <span className="icon" style={{ fontSize: 16 }}>delete</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                totalItems={filtrado.length}
                pageSize={PAGE_SIZE}
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}

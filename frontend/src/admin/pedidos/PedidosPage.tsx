import { useState } from 'react'
import { toast } from 'sonner'
import AdminLayout from '../AdminLayout'
import { usePedidos } from './hooks/usePedidos'
import type { PedidoAdmin, CreatePedidoInput } from './hooks/usePedidos'
import PedidoCard from './PedidoCard'
import PedidoForm from './PedidoForm'
import AvisoCard from './AvisoCard'
import { ESTADO_META, fmtPedidoDate, fmtDeliveryDate } from './helpers/pedido.helpers'

const fmt = (n: number | string) =>
  '$' + parseFloat(String(n)).toLocaleString('es-AR', { minimumFractionDigits: 0 })

function EmptyActivos() {
  return (
    <div
      className="bg-white flex flex-col items-center gap-[6px] py-12 px-6 text-center mb-2"
      style={{ border: '1.5px dashed #E2CFB5', borderRadius: 16 }}
    >
      <div
        className="flex items-center justify-center mb-[6px]"
        style={{ width: 72, height: 72, borderRadius: '50%', background: '#F3E8D8' }}
      >
        <span className="icon" style={{ fontSize: 38, color: '#9A7A66' }}>inbox</span>
      </div>
      <div className="text-[16px] font-bold text-muted">No hay pedidos activos</div>
      <div className="text-[13px] text-muted">Los nuevos pedidos apareceran aqui</div>
    </div>
  )
}

export default function PedidosPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  const { query, crearPedido, cambiarEstado, eliminarPedido } = usePedidos()
  const pedidos = query.data ?? []

  const activos = pedidos
    .filter((p) => p.estado === 'pendiente' || p.estado === 'por_entregar')
    .sort((a, b) => {
      if (!a.fechaEntrega) return 1
      if (!b.fechaEntrega) return -1
      return new Date(a.fechaEntrega).getTime() - new Date(b.fechaEntrega).getTime()
    })

  const sumItems = (arr: PedidoAdmin[]) =>
    arr.reduce((s, p) => s + p.items.reduce((ss, it) => ss + it.cantidad, 0), 0)

  const buildBreakdown = (arr: PedidoAdmin[]) => {
    const map = new Map<number, { qty: number; name: string }>()
    arr.forEach((p) => {
      p.items.forEach((it) => {
        const prev = map.get(it.productoId)
        map.set(it.productoId, { qty: (prev?.qty ?? 0) + it.cantidad, name: it.producto.nombre })
      })
    })
    return [...map.entries()]
      .map(([productoId, { qty, name }]) => ({ productoId, qty, name }))
      .sort((a, b) => b.qty - a.qty)
  }

  const pendientes = pedidos.filter((p) => p.estado === 'pendiente')
  const porEntregar = pedidos.filter((p) => p.estado === 'por_entregar')
  const productosPorPagar = sumItems(pendientes)
  const productosPorEntregar = sumItems(porEntregar)
  const desglosePorPagar = buildBreakdown(pendientes)
  const desglosePorEntregar = buildBreakdown(porEntregar)

  const historial = pedidos
    .filter((p) => p.estado === 'entregado' || p.estado === 'cancelado')
    .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())

  const handleCrear = (data: CreatePedidoInput) => {
    crearPedido.mutate(data, { onSuccess: () => setFormOpen(false) })
  }

  const handleMarcarPagado = (id: number) => {
    cambiarEstado.mutate({ id, estado: 'por_entregar' }, {
      onSuccess: () => toast.success('Pedido marcado como pagado'),
    })
  }

  const handleMarcarEntregado = (id: number) => {
    cambiarEstado.mutate({ id, estado: 'entregado' }, {
      onSuccess: () => toast.success('Pedido entregado'),
    })
  }

  const handleCancelar = (id: number) => {
    cambiarEstado.mutate({ id, estado: 'cancelado' }, {
      onSuccess: () => toast.success('Pedido cancelado'),
    })
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="px-4 lg:px-8 pt-6 lg:pt-8 flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-sand-deep pb-5">
        <div>
          <h1 className="font-display text-[28px] lg:text-[34px] font-extrabold text-espresso leading-none">
            Pedidos
          </h1>
          <p className="text-sm text-muted mt-2 font-medium">
            Gestiona los pedidos de tus clientes
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center gap-2 bg-terra text-white px-4 py-2.5 rounded-[12px] border-none font-sans text-sm font-bold cursor-pointer transition-colors hover:bg-terra-dark self-start sm:self-auto shrink-0"
          style={{ boxShadow: '0 3px 12px rgba(196,82,42,0.3)' }}
        >
          <span className="icon icon-fill" style={{ fontSize: 19 }}>add_circle</span>
          Nuevo pedido
        </button>
      </div>

      <div className="px-4 lg:px-8 py-6 flex flex-col gap-5">
        {/* Aviso pendientes */}
        {(productosPorPagar > 0 || productosPorEntregar > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AvisoCard
              icon="payments"
              label="Pendientes por pagar"
              total={productosPorPagar}
              pedidosCount={pendientes.length}
              breakdown={desglosePorPagar}
              accent={{
                bg: 'var(--color-gold-light)',
                border: '#F0DDA8',
                iconBg: 'var(--color-gold)',
                labelColor: 'var(--color-gold)',
                chipBg: 'rgba(212,146,10,0.12)',
                chipText: '#8a5d04',
                chipBorder: 'rgba(212,146,10,0.22)',
              }}
            />
            <AvisoCard
              icon="local_shipping"
              label="Pendientes por entregar"
              total={productosPorEntregar}
              pedidosCount={porEntregar.length}
              breakdown={desglosePorEntregar}
              accent={{
                bg: 'var(--color-terra-light)',
                border: '#E8C8B8',
                iconBg: 'var(--color-terra)',
                labelColor: 'var(--color-terra-dark)',
                chipBg: 'rgba(196,107,71,0.12)',
                chipText: 'var(--color-terra-dark)',
                chipBorder: 'rgba(196,107,71,0.22)',
              }}
            />
          </div>
        )}

        {/* Activos */}
        <div>
          <div className="flex items-center gap-[10px] mb-[14px]">
            <span className="font-display font-extrabold text-[20px] text-espresso">Activos</span>
            <span
              className="inline-flex items-center justify-center text-[13px] font-extrabold text-white"
              style={{
                minWidth: 26, height: 26, padding: '0 8px', borderRadius: 99,
                background: activos.length ? '#C4522A' : '#E2CFB5',
              }}
            >
              {activos.length}
            </span>
          </div>

          {activos.length === 0 ? (
            <EmptyActivos />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {activos.map((p) => (
                <PedidoCard
                  key={p.id}
                  pedido={p}
                  onMarcarPagado={handleMarcarPagado}
                  onMarcarEntregado={handleMarcarEntregado}
                  onCancelar={handleCancelar}
                />
              ))}
            </div>
          )}
        </div>

        {/* Historial */}
        <div>
          <button
            type="button"
            onClick={() => setHistoryOpen((o) => !o)}
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
              {historyOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {historyOpen && (
            <div className="mt-3">
              {historial.length === 0 ? (
                <div
                  className="py-6 text-center text-sm font-medium text-muted bg-white"
                  style={{ border: '1.5px solid #F3E8D8', borderRadius: 12 }}
                >
                  Aun no hay pedidos en el historial
                </div>
              ) : (
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
                            style={{ padding: '14px 18px', fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#7A4020' }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {historial.map((p) => {
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
                                <span className="text-[12.5px] text-muted">—</span>
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
                                  onClick={() => eliminarPedido.mutate(p.id)}
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
              )}
            </div>
          )}
        </div>
      </div>

      {formOpen && (
        <PedidoForm
          onClose={() => setFormOpen(false)}
          onSave={handleCrear}
          loading={crearPedido.isPending}
        />
      )}
    </AdminLayout>
  )
}

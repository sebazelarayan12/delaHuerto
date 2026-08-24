import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import AdminLayout from '../AdminLayout'
import { usePedidos } from './hooks/usePedidos'
import type { PedidoAdmin, CreatePedidoInput } from './hooks/usePedidos'
import PedidoCard from './PedidoCard'
import PedidoForm from './PedidoForm'
import AvisoCard from './AvisoCard'
import HistorialSection from './HistorialSection'

type FiltroActivos = 'todos' | 'pendiente' | 'por_entregar'

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
  const [filtroActivos, setFiltroActivos] = useState<FiltroActivos>('todos')

  const { query, crearPedido, editarPedido, cambiarEstado, eliminarPedido } = usePedidos()
  const [editando, setEditando] = useState<PedidoAdmin | null>(null)
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

  const activosFiltrados =
    filtroActivos === 'todos'
      ? activos
      : activos.filter((p) => p.estado === filtroActivos)

  const activeCount = pendientes.length + porEntregar.length

  useEffect(() => {
    const base = 'Pedidos — Huerto Admin'
    document.title = activeCount > 0 ? `(${activeCount}) ${base}` : base
    return () => { document.title = 'Huerto Admin' }
  }, [activeCount])

  const handleGuardar = (data: CreatePedidoInput) => {
    if (editando) {
      editarPedido.mutate({ id: editando.id, ...data }, {
        onSuccess: () => { setFormOpen(false); setEditando(null) },
      })
    } else {
      crearPedido.mutate(data, { onSuccess: () => setFormOpen(false) })
    }
  }

  const handleEditar = (pedido: PedidoAdmin) => {
    setEditando(pedido)
    setFormOpen(true)
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

  const handleCardFiltro = (key: 'pendiente' | 'por_entregar') => {
    setFiltroActivos(prev => prev === key ? 'todos' : key)
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="px-4 lg:px-8 pt-6 lg:pt-8 flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-sand-deep pb-5">
        <div>
          <h1 className="font-display text-[28px] lg:text-[34px] font-semibold text-espresso leading-none">
            Pedidos
          </h1>
          <p className="text-sm text-muted mt-2 font-medium">
            Gestiona los pedidos de tus clientes
          </p>
        </div>
        <button
          onClick={() => { setEditando(null); setFormOpen(true) }}
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
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold text-muted tracking-wide">Haz click para filtrar</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AvisoCard
              icon="payments"
              label="Pendientes por pagar"
              total={productosPorPagar}
              pedidosCount={pendientes.length}
              breakdown={desglosePorPagar}
              onClick={() => handleCardFiltro('pendiente')}
              isActive={filtroActivos === 'pendiente'}
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
              onClick={() => handleCardFiltro('por_entregar')}
              isActive={filtroActivos === 'por_entregar'}
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
            {filtroActivos !== 'todos' && (
              <button
                type="button"
                onClick={() => setFiltroActivos('todos')}
                className="ml-1 text-[11px] font-bold text-muted border border-sand-deep rounded-full px-2 py-0.5 cursor-pointer hover:text-terra hover:border-terra transition-colors font-sans"
              >
                Limpiar filtro
              </button>
            )}
          </div>

          {activos.length === 0 ? (
            <EmptyActivos />
          ) : activosFiltrados.length === 0 ? (
            <div
              className="py-6 text-center text-sm font-medium text-muted bg-white"
              style={{ border: '1.5px dashed #E2CFB5', borderRadius: 16 }}
            >
              No hay pedidos con ese filtro
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activosFiltrados.map((p) => (
                <PedidoCard
                  key={p.id}
                  pedido={p}
                  onMarcarPagado={handleMarcarPagado}
                  onMarcarEntregado={handleMarcarEntregado}
                  onCancelar={handleCancelar}
                  onEditar={handleEditar}
                />
              ))}
            </div>
          )}
        </div>

        {/* Historial */}
        <HistorialSection
          historial={historial}
          onEliminar={(id) => eliminarPedido.mutate(id)}
        />
      </div>

      {formOpen && (
        <PedidoForm
          key={editando?.id ?? 'new'}
          initial={editando}
          onClose={() => { setFormOpen(false); setEditando(null) }}
          onSave={handleGuardar}
          loading={editando ? editarPedido.isPending : crearPedido.isPending}
        />
      )}
    </AdminLayout>
  )
}

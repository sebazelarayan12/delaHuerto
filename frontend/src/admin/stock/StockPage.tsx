import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import AdminLayout from '../AdminLayout'
import { useStock, useHistorialStock, getStockStatus, STOCK_STATUS } from './hooks/useStock'
import type { ProductoConStock } from './hooks/useStock'

const ajusteSchema = z.object({
  cantidad: z.coerce.number().int().refine((n) => n !== 0, { message: 'No puede ser 0' }),
  motivo: z.string().min(1, { message: 'Motivo requerido' }),
})
type AjusteForm = z.infer<typeof ajusteSchema>

const STATUS_STYLES = {
  [STOCK_STATUS.OK]: 'bg-green-50 text-green-700',
  [STOCK_STATUS.BAJO]: 'bg-amber-50 text-amber-700',
  [STOCK_STATUS.CRITICO]: 'bg-orange-50 text-orange-700',
  [STOCK_STATUS.SIN_STOCK]: 'bg-red-50 text-red-600',
} as const

const STATUS_LABEL = {
  [STOCK_STATUS.OK]: 'OK',
  [STOCK_STATUS.BAJO]: 'Bajo',
  [STOCK_STATUS.CRITICO]: 'Critico',
  [STOCK_STATUS.SIN_STOCK]: 'Sin stock',
} as const

interface AjusteModalProps {
  producto: ProductoConStock
  onClose: () => void
  onSave: (cantidad: number, motivo: string) => void
  loading: boolean
}

function AjusteModal({ producto, onClose, onSave, loading }: AjusteModalProps) {
  const [historialOpen, setHistorialOpen] = useState(false)
  const historial = useHistorialStock(historialOpen ? producto.id : 0)

  const { register, handleSubmit, formState: { errors } } = useForm<AjusteForm>({
    resolver: zodResolver(ajusteSchema),
    defaultValues: { cantidad: undefined, motivo: '' },
  })

  const onSubmit = (data: AjusteForm) => onSave(data.cantidad, data.motivo)

  return (
    <div
      className="fixed inset-0 bg-espresso/50 z-50 flex items-center justify-center p-5 font-sans"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
    >
      <div className="bg-white rounded-[18px] w-full max-w-[480px] shadow-[0_20px_60px_rgba(44,18,8,0.2)] overflow-hidden max-h-[90vh] flex flex-col">
        <div className="py-5 px-6 border-b border-sand flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-extrabold text-espresso">Ajustar stock</h2>
            <p className="text-sm text-muted mt-0.5">{producto.nombre}</p>
          </div>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-muted flex items-center transition-colors hover:text-brown">
            <span className="icon">close</span>
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="px-6 py-4 bg-sand/40 border-b border-sand flex items-center gap-3">
            <span className="icon icon-fill text-[28px] text-terra">inventory_2</span>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.08em] text-brown">Stock actual</div>
              <div className="text-[26px] font-extrabold font-display text-espresso leading-none">{producto.stock}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-xs font-bold uppercase tracking-[0.08em] text-brown">Minimo</div>
              <div className="text-[20px] font-extrabold font-display text-muted leading-none">{producto.stockMinimo}</div>
            </div>
          </div>

          <form id="ajuste-form" onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 flex flex-col gap-4">
            <div>
              <label htmlFor="ajuste-cantidad" className="block text-xs font-bold uppercase tracking-[0.08em] text-brown mb-1.5">
                Cantidad (+ para agregar, − para descontar)
              </label>
              <input
                id="ajuste-cantidad"
                type="number"
                placeholder="Ej: 50 o -10"
                {...register('cantidad')}
                className="w-full px-[13px] py-2.5 border-[1.5px] border-sand-deep rounded-[10px] font-sans text-sm text-espresso bg-cream outline-none focus:border-terra"
              />
              {errors.cantidad && <span className="text-xs text-red-600 mt-1 block">{errors.cantidad.message}</span>}
            </div>

            <div>
              <label htmlFor="ajuste-motivo" className="block text-xs font-bold uppercase tracking-[0.08em] text-brown mb-1.5">
                Motivo
              </label>
              <input
                id="ajuste-motivo"
                type="text"
                placeholder="Ej: Carga semanal, Correccion de inventario"
                {...register('motivo')}
                className="w-full px-[13px] py-2.5 border-[1.5px] border-sand-deep rounded-[10px] font-sans text-sm text-espresso bg-cream outline-none focus:border-terra"
              />
              {errors.motivo && <span className="text-xs text-red-600 mt-1 block">{errors.motivo.message}</span>}
            </div>
          </form>

          {/* Historial */}
          <div className="border-t border-sand">
            <button
              type="button"
              onClick={() => setHistorialOpen((v) => !v)}
              className="flex items-center justify-between w-full px-6 py-3 bg-transparent border-none cursor-pointer text-left"
            >
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-brown">Historial de ajustes</span>
              <span className="icon text-muted text-[18px]">{historialOpen ? 'expand_less' : 'expand_more'}</span>
            </button>

            {historialOpen && (
              <div className="px-4 pb-4">
                {historial.isLoading ? (
                  <p className="text-xs text-muted text-center py-3">Cargando…</p>
                ) : !historial.data?.length ? (
                  <p className="text-xs text-muted text-center py-3">Sin ajustes registrados</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {historial.data.map((a) => (
                      <div key={a.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sand/40">
                        <span className={`text-xs font-extrabold w-10 shrink-0 ${a.cantidad > 0 ? 'text-green-700' : 'text-red-600'}`}>
                          {a.cantidad > 0 ? `+${a.cantidad}` : a.cantidad}
                        </span>
                        <span className="text-xs text-espresso flex-1 truncate">{a.motivo}</span>
                        <span className="text-[10px] text-muted shrink-0">
                          {new Date(a.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-sand shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-[10px] border-[1.5px] border-sand-deep bg-transparent font-sans text-sm font-semibold text-brown cursor-pointer transition-colors hover:bg-sand"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="ajuste-form"
            disabled={loading}
            className={`px-4 py-2.5 rounded-[10px] border-none font-sans text-sm font-semibold flex items-center gap-1.5 shadow-[0_2px_8px_rgba(196,82,42,0.3)] transition-colors ${loading ? 'bg-sand-deep text-white cursor-not-allowed' : 'bg-terra text-white cursor-pointer hover:bg-terra-dark'}`}
          >
            <span className="icon icon-fill text-[17px]">save</span>
            Confirmar ajuste
          </button>
        </div>
      </div>
    </div>
  )
}

export default function StockPage() {
  const { query, ajustar } = useStock()
  const [selected, setSelected] = useState<ProductoConStock | null>(null)
  const [busqueda, setBusqueda] = useState('')

  const productos = query.data ?? []
  const filtrados = busqueda
    ? productos.filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    : productos

  const criticos = productos.filter((p) => {
    const s = getStockStatus(p.stock, p.stockMinimo)
    return s === STOCK_STATUS.CRITICO || s === STOCK_STATUS.SIN_STOCK
  }).length

  const handleAjuste = (cantidad: number, motivo: string) => {
    if (!selected) return
    ajustar.mutate(
      { id: selected.id, cantidad, motivo },
      { onSuccess: () => setSelected(null) }
    )
  }

  return (
    <AdminLayout>
      <div>
        <div className="px-4 lg:px-8 pt-6 lg:pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sand-deep pb-5">
          <div>
            <h1 className="text-[22px] font-extrabold text-espresso">Stock</h1>
            {criticos > 0 && (
              <p className="text-sm text-orange-700 mt-1 flex items-center gap-1">
                <span className="icon icon-fill text-[16px]">warning</span>
                {criticos} {criticos === 1 ? 'producto con stock critico' : 'productos con stock critico'}
              </p>
            )}
          </div>
          <input
            type="search"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="px-3 py-2 border-[1.5px] border-sand-deep rounded-[10px] font-sans text-sm text-espresso bg-cream outline-none focus:border-terra w-full sm:w-[220px]"
          />
        </div>

        <div className="px-4 lg:px-8 py-5">
          {query.isLoading ? (
            <div className="text-center py-12 text-muted text-sm">Cargando stock…</div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-12 text-muted text-sm">
              {busqueda ? 'Sin resultados para esa busqueda' : 'Sin productos'}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(44,18,8,0.06)] overflow-hidden">
              {/* Header tabla — solo desktop */}
              <div className="hidden lg:grid grid-cols-[auto_1fr_160px_120px_120px_120px] gap-4 px-5 py-3 border-b border-sand bg-sand/30">
                <div className="w-10" />
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted">Producto</div>
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted">Categoria</div>
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted text-center">Stock</div>
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted text-center">Minimo</div>
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted text-center">Accion</div>
              </div>

              <div className="divide-y divide-sand">
                {filtrados.map((p) => {
                  const status = getStockStatus(p.stock, p.stockMinimo)
                  return (
                    <div key={p.id} className="flex lg:grid lg:grid-cols-[auto_1fr_160px_120px_120px_120px] items-center gap-3 lg:gap-4 px-4 lg:px-5 py-3">
                      {/* Foto */}
                      <div className="w-10 h-10 rounded-lg bg-sand flex items-center justify-center shrink-0 overflow-hidden">
                        {p.fotoUrl
                          ? <img src={p.fotoUrl} alt={p.nombre} className="w-full h-full object-cover" />
                          : <span className="icon text-[22px] text-muted">lunch_dining</span>
                        }
                      </div>

                      {/* Nombre */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-espresso truncate">{p.nombre}</div>
                        <div className="text-xs text-muted lg:hidden">{p.categoria.nombre}</div>
                      </div>

                      {/* Categoria — solo desktop */}
                      <div className="hidden lg:block text-sm text-muted truncate">{p.categoria.nombre}</div>

                      {/* Stock con badge */}
                      <div className="flex lg:justify-center items-center gap-2 shrink-0">
                        <span className="font-display text-[20px] font-extrabold text-espresso">{p.stock}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[status]}`}>
                          {STATUS_LABEL[status]}
                        </span>
                      </div>

                      {/* Minimo — solo desktop */}
                      <div className="hidden lg:flex justify-center">
                        <span className="text-sm text-muted font-semibold">{p.stockMinimo}</span>
                      </div>

                      {/* Boton ajustar */}
                      <div className="flex lg:justify-center shrink-0">
                        <button
                          onClick={() => setSelected(p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-[1.5px] border-terra/40 bg-transparent text-terra text-xs font-semibold cursor-pointer transition-colors hover:bg-terra/5"
                        >
                          <span className="icon text-[15px]">edit</span>
                          <span className="hidden sm:inline">Ajustar</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <AjusteModal
          producto={selected}
          onClose={() => setSelected(null)}
          onSave={handleAjuste}
          loading={ajustar.isPending}
        />
      )}
    </AdminLayout>
  )
}

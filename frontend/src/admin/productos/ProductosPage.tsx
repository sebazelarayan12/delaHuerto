import { useReducer, useState, useEffect } from 'react'
import { toast } from 'sonner'
import AdminLayout from '../AdminLayout'
import { useProductos } from './hooks/useProductos'
import type { ProductoAdmin } from './hooks/useProductos'
import ProductoForm from './ProductoForm'
import { useCategorias } from '../categorias/hooks/useCategorias'
import Toggle from '../../shared/components/Toggle'
import TableSkeleton from '../../shared/components/TableSkeleton'

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

type State = {
  modalOpen: boolean
  editing: ProductoAdmin | null
  search: string
  filterCat: number | ''
}

type Action =
  | { type: 'OPEN_NEW' }
  | { type: 'OPEN_EDIT'; payload: ProductoAdmin }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_FILTER'; payload: number | '' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'OPEN_NEW': return { ...state, modalOpen: true, editing: null }
    case 'OPEN_EDIT': return { ...state, modalOpen: true, editing: action.payload }
    case 'CLOSE_MODAL': return { ...state, modalOpen: false, editing: null }
    case 'SET_SEARCH': return { ...state, search: action.payload }
    case 'SET_FILTER': return { ...state, filterCat: action.payload }
    default: return state
  }
}

const initialState: State = { modalOpen: false, editing: null, search: '', filterCat: '' }

export default function ProductosPage() {
  const { query, crear, editar, toggleDisponible, eliminar, reordenar } = useProductos()
  const { query: catQuery } = useCategorias()
  const [state, dispatch] = useReducer(reducer, initialState)
  const { modalOpen, editing, search, filterCat } = state

  const [localProductos, setLocalProductos] = useState<ProductoAdmin[]>([])
  const [draggedId, setDraggedId] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<ProductoAdmin | null>(null)

  useEffect(() => {
    if (query.data) {
      setLocalProductos([...query.data].sort((a, b) => a.orden - b.orden))
    }
  }, [query.data])

  const hasFilters = search !== '' || filterCat !== ''

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, targetId: number) => {
    e.preventDefault()
    if (draggedId === null || draggedId === targetId) return
    const draggedIdx = localProductos.findIndex((p) => p.id === draggedId)
    const targetIdx = localProductos.findIndex((p) => p.id === targetId)
    const newProds = [...localProductos]
    const [draggedProd] = newProds.splice(draggedIdx, 1)
    newProds.splice(targetIdx, 0, draggedProd)
    setLocalProductos(newProds)
  }

  const handleDragEnd = async () => {
    if (draggedId === null) return
    setDraggedId(null)
    const originalOrder = [...(query.data ?? [])].sort((a, b) => a.orden - b.orden)
    const changed = localProductos.some((p, i) => p.id !== originalOrder[i]?.id)
    if (!changed) return

    const ordenes = localProductos.map((p, i) => ({ id: p.id, orden: i }))
    try {
      await reordenar.mutateAsync(ordenes)
      toast.success('Orden actualizado')
    } catch {
      toast.error('Error al reordenar')
      setLocalProductos([...originalOrder])
    }
  }

  const handleSave = async (
    data: { categoriaId: number; nombre: string; descripcion?: string; precio: number; precioCongelada?: number; disponible: boolean; orden: number },
    foto: File | null
  ) => {
    const fd = new FormData()
    fd.append('categoriaId', String(data.categoriaId))
    fd.append('nombre', data.nombre)
    if (data.descripcion) fd.append('descripcion', data.descripcion)
    fd.append('precio', String(data.precio))
    if (data.precioCongelada !== undefined) fd.append('precioCongelada', String(data.precioCongelada))
    fd.append('disponible', String(data.disponible))
    fd.append('orden', String(data.orden))
    if (foto) fd.append('foto', foto)

    try {
      if (editing) {
        await editar.mutateAsync({ id: editing.id, formData: fd })
        toast.success('Producto actualizado')
      } else {
        await crear.mutateAsync(fd)
        toast.success('Producto creado')
      }
      dispatch({ type: 'CLOSE_MODAL' })
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al guardar'
      toast.error(msg)
    }
  }

  const handleToggle = async (prod: ProductoAdmin) => {
    const nuevoValor = !prod.disponible
    const res = await toggleDisponible.mutateAsync({ id: prod.id, disponible: nuevoValor })
    if (nuevoValor && !res.data.disponible) {
      toast.error(`"${prod.nombre}" no tiene stock: agregá stock antes de marcarlo disponible`)
    }
  }

  const openEdit = (prod: ProductoAdmin) => dispatch({ type: 'OPEN_EDIT', payload: prod })
  const openNew = () => dispatch({ type: 'OPEN_NEW' })

  const productos = localProductos.filter((p) => {
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === '' || p.categoriaId === filterCat
    return matchSearch && matchCat
  })

  const categorias = catQuery.data ?? []
  const nextOrden = localProductos.length > 0 ? Math.max(...localProductos.map((p) => p.orden)) + 1 : 0

  return (
    <AdminLayout>
      <div className="px-4 lg:px-8 pt-6 lg:pt-8 pb-5 border-b border-sand-deep flex justify-between items-start gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold text-espresso">Productos</h1>
          <p className="text-sm text-muted mt-1">
            {query.data?.length ?? 0} productos en total
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] border-none bg-terra text-white font-sans text-sm font-semibold cursor-pointer shadow-[0_2px_8px_rgba(196,82,42,0.3)] shrink-0 transition-opacity hover:opacity-90"
        >
          <span className="icon icon-fill text-[18px]">add_circle</span>
          <span className="hidden sm:inline">Nuevo producto</span>
          <span className="sm:hidden">Nuevo</span>
        </button>
      </div>

      <div className="px-4 lg:px-8 pt-5 pb-2 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="icon absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[18px]">search</span>
          <input
            type="text"
            placeholder="Buscar producto…"
            value={search}
            onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
            className="w-full pl-10 pr-3 py-2.5 border-[1.5px] border-sand-deep rounded-[10px] font-sans text-sm text-espresso bg-white outline-none"
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => dispatch({ type: 'SET_FILTER', payload: e.target.value === '' ? '' : Number(e.target.value) })}
          className="w-full sm:w-56 px-3 py-2.5 border-[1.5px] border-sand-deep rounded-[10px] font-sans text-sm text-espresso bg-white outline-none"
        >
          <option value="">Todas las categorias</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {query.isLoading ? (
        <p className="px-4 lg:px-8 pb-1 text-xs text-muted flex items-center gap-1.5">
          <span className="icon text-[14px] animate-spin motion-reduce:animate-none">progress_activity</span>
          Cargando tus productos guardados…
        </p>
      ) : !hasFilters && (
        <p className="px-4 lg:px-8 pb-1 text-xs text-muted">
          Arrasta las filas para cambiar el orden
        </p>
      )}

      <div className="px-4 lg:px-8 pb-8 pt-2">
        <div className="bg-white rounded-[14px] shadow-[0_2px_8px_rgba(44,18,8,0.06)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-sans min-w-[640px]">
                <thead>
                  <tr className="bg-gold-light">
                    {[!hasFilters ? '' : null, 'Foto', 'Nombre', 'Categoria', 'Precio', 'Estado', 'Disponible', 'Acciones'].filter((h) => h !== null).map((h, i) => (
                      <th key={h || `empty-${i}`} className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.08em] text-muted border-b border-sand-deep whitespace-nowrap ${h === '' ? 'w-10' : 'w-auto'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {query.isLoading ? (
                    <TableSkeleton columns={!hasFilters ? 8 : 7} />
                  ) : productos.map((prod, i) => (
                    <tr
                      key={prod.id}
                      draggable={!hasFilters}
                      onDragStart={!hasFilters ? (e) => handleDragStart(e, prod.id) : undefined}
                      onDragOver={!hasFilters ? (e) => handleDragOver(e, prod.id) : undefined}
                      onDragEnd={!hasFilters ? handleDragEnd : undefined}
                      className={`transition-all duration-200 ${i < productos.length - 1 ? 'border-b border-sand' : ''} ${draggedId === prod.id ? 'bg-ivory opacity-60' : 'bg-transparent'} ${!hasFilters ? 'cursor-grab' : ''}`}
                    >
                      {!hasFilters && (
                        <td className="px-4 py-3 w-10">
                          <span className="icon text-sand-deep text-[20px]">drag_indicator</span>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="w-11 h-11 rounded-lg overflow-hidden bg-sand flex items-center justify-center text-[20px]">
                          {prod.fotoUrl ? (
                            <img src={prod.fotoUrl} alt={prod.nombre} className="w-full h-full object-cover" />
                          ) : <span className="icon text-[20px] text-muted">lunch_dining</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-espresso whitespace-nowrap">{prod.nombre}</td>
                      <td className="px-4 py-3 text-[13px] text-muted whitespace-nowrap">{prod.categoria.nombre}</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full bg-cocinada shrink-0" />
                          <span className="font-bold text-espresso">{fmt(parseFloat(prod.precio as unknown as string))}</span>
                        </div>
                        {prod.precioCongelada && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="size-1.5 rounded-full bg-congelada shrink-0" />
                            <span className="font-semibold text-muted text-xs">{fmt(parseFloat(prod.precioCongelada))}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${prod.disponible ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          <span className="icon text-[13px]">{prod.disponible ? 'check_circle' : 'cancel'}</span>
                          {prod.disponible ? 'Disponible' : 'No disponible'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Toggle checked={prod.disponible} onChange={() => handleToggle(prod)} label={prod.disponible ? 'Marcar no disponible' : 'Marcar disponible'} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openEdit(prod)}
                            className="inline-flex items-center justify-center w-[34px] h-[34px] rounded-lg border-[1.5px] border-sand-deep bg-transparent cursor-pointer text-brown transition-colors hover:bg-sand"
                            title="Editar"
                          >
                            <span className="icon text-[17px]">edit</span>
                          </button>
                          <button
                            onClick={() => setConfirmDelete(prod)}
                            className="inline-flex items-center justify-center w-[34px] h-[34px] rounded-lg border-[1.5px] border-red-200 bg-transparent cursor-pointer text-red-600 transition-colors hover:bg-red-50"
                            title="Eliminar"
                          >
                            <span className="icon text-[17px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!query.isLoading && productos.length === 0 && (
              <div className="p-10 text-center text-muted text-sm">
                No se encontraron productos
              </div>
            )}
        </div>
      </div>

      <ProductoForm
        key={`${modalOpen}-${editing?.id ?? 'new'}`}
        open={modalOpen}
        onClose={() => dispatch({ type: 'CLOSE_MODAL' })}
        onSave={handleSave}
        initial={editing}
        categorias={categorias}
        loading={crear.isPending || editar.isPending}
        nextOrden={nextOrden}
      />

      {confirmDelete && (
        <div
          className="fixed inset-0 bg-espresso/50 z-50 flex items-center justify-center p-5 font-sans"
          role="presentation"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null) }}
          onKeyDown={(e) => { if (e.key === 'Escape') setConfirmDelete(null) }}
        >
          <div className="bg-white rounded-[18px] w-full max-w-[380px] shadow-[0_20px_60px_rgba(44,18,8,0.2)] p-6 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <span className="icon icon-fill text-[28px] text-red-600 shrink-0">warning</span>
              <div>
                <h3 className="text-base font-extrabold text-espresso">Eliminar producto</h3>
                <p className="text-sm text-muted mt-1">
                  "{confirmDelete.nombre}" se eliminara definitivamente. Si tiene ventas o ajustes de stock registrados, usa el toggle para desactivarlo en su lugar.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2.5 rounded-[10px] border-[1.5px] border-sand-deep bg-transparent font-sans text-sm font-semibold text-brown cursor-pointer hover:bg-sand"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const prod = confirmDelete
                  setConfirmDelete(null)
                  try {
                    await eliminar.mutateAsync(prod.id)
                    toast.success(`"${prod.nombre}" eliminado`)
                  } catch (e: unknown) {
                    const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al eliminar'
                    toast.error(msg)
                  }
                }}
                disabled={eliminar.isPending}
                className={`px-4 py-2.5 rounded-[10px] border-none font-sans text-sm font-semibold text-white flex items-center gap-1.5 cursor-pointer ${eliminar.isPending ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
              >
                <span className="icon text-[17px]">delete</span>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

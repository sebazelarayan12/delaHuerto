import { useReducer } from 'react'
import AdminLayout from '../AdminLayout'
import { useProductos } from './hooks/useProductos'
import type { ProductoAdmin } from './hooks/useProductos'
import ProductoForm from './ProductoForm'
import { useCategorias } from '../categorias/hooks/useCategorias'
import Toggle from '../../shared/components/Toggle'

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

type State = {
  modalOpen: boolean
  editing: ProductoAdmin | null
  search: string
  filterCat: number | ''
  toast: { msg: string; error?: boolean } | null
}

type Action =
  | { type: 'OPEN_NEW' }
  | { type: 'OPEN_EDIT'; payload: ProductoAdmin }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_FILTER'; payload: number | '' }
  | { type: 'SHOW_TOAST'; payload: { msg: string; error?: boolean } }
  | { type: 'CLEAR_TOAST' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'OPEN_NEW': return { ...state, modalOpen: true, editing: null }
    case 'OPEN_EDIT': return { ...state, modalOpen: true, editing: action.payload }
    case 'CLOSE_MODAL': return { ...state, modalOpen: false, editing: null }
    case 'SET_SEARCH': return { ...state, search: action.payload }
    case 'SET_FILTER': return { ...state, filterCat: action.payload }
    case 'SHOW_TOAST': return { ...state, toast: action.payload }
    case 'CLEAR_TOAST': return { ...state, toast: null }
    default: return state
  }
}

const initialState: State = { modalOpen: false, editing: null, search: '', filterCat: '', toast: null }

export default function ProductosPage() {
  const { query, crear, editar, toggleDisponible, eliminar } = useProductos()
  const { query: catQuery } = useCategorias()
  const [state, dispatch] = useReducer(reducer, initialState)
  const { modalOpen, editing, search, filterCat, toast } = state

  const showToast = (msg: string, error = false) => {
    dispatch({ type: 'SHOW_TOAST', payload: { msg, error } })
    setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 3000)
  }

  const handleSave = async (
    data: { categoriaId: number; nombre: string; descripcion?: string; precio: number; precioUnidad?: number | ''; disponible: boolean; orden: number },
    foto: File | null
  ) => {
    const fd = new FormData()
    fd.append('categoriaId', String(data.categoriaId))
    fd.append('nombre', data.nombre)
    if (data.descripcion) fd.append('descripcion', data.descripcion)
    fd.append('precio', String(data.precio))
    if (data.precioUnidad) fd.append('precioUnidad', String(data.precioUnidad))
    fd.append('disponible', String(data.disponible))
    fd.append('orden', String(data.orden))
    if (foto) fd.append('foto', foto)

    try {
      if (editing) {
        await editar.mutateAsync({ id: editing.id, formData: fd })
        showToast('Producto actualizado')
      } else {
        await crear.mutateAsync(fd)
        showToast('Producto creado')
      }
      dispatch({ type: 'CLOSE_MODAL' })
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al guardar'
      showToast(msg, true)
    }
  }

  const handleToggle = async (prod: ProductoAdmin) => {
    await toggleDisponible.mutateAsync({ id: prod.id, disponible: !prod.disponible })
  }

  const openEdit = (prod: ProductoAdmin) => dispatch({ type: 'OPEN_EDIT', payload: prod })
  const openNew = () => dispatch({ type: 'OPEN_NEW' })

  const productos = (query.data ?? []).filter((p) => {
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === '' || p.categoriaId === filterCat
    return matchSearch && matchCat
  })

  const categorias = catQuery.data ?? []

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
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] border-none bg-terra text-white font-sans text-[13.5px] font-semibold cursor-pointer shadow-[0_2px_8px_rgba(196,82,42,0.3)] shrink-0 transition-opacity hover:opacity-90"
        >
          <span className="icon icon-fill text-[18px]">add_circle</span>
          <span className="hidden sm:inline">Nuevo producto</span>
          <span className="sm:hidden">Nuevo</span>
        </button>
      </div>

      {/* Filtros: stack en mobile, fila en sm+ */}
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
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      <div className="px-4 lg:px-8 pb-8 pt-2">
        {query.isLoading ? (
          <div className="text-center p-10 text-muted">Cargando…</div>
        ) : (
          <div className="bg-white rounded-[14px] shadow-[0_2px_8px_rgba(44,18,8,0.06)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-sans min-w-[640px]">
                <thead>
                  <tr className="bg-gold-light">
                    {['Foto', 'Nombre', 'Categoría', 'Precio', 'Estado', 'Disponible', 'Acciones'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-muted border-b border-sand-deep whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {productos.map((prod, i) => (
                    <tr key={prod.id} className={i < productos.length - 1 ? 'border-b border-sand' : ''}>
                      <td className="px-4 py-3">
                        <div className="w-11 h-11 rounded-lg overflow-hidden bg-sand flex items-center justify-center text-[20px]">
                          {prod.fotoUrl ? (
                            <img src={prod.fotoUrl} alt={prod.nombre} className="w-full h-full object-cover" />
                          ) : '🥟'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-espresso whitespace-nowrap">{prod.nombre}</td>
                      <td className="px-4 py-3 text-[13px] text-muted whitespace-nowrap">{prod.categoria.nombre}</td>
                      <td className="px-4 py-3 text-sm font-bold text-terra whitespace-nowrap">{fmt(parseFloat(prod.precio as unknown as string))}</td>
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
                            onClick={async () => {
                              if (confirm(`¿Eliminar definitivamente el producto "${prod.nombre}"? Esta acción no se puede deshacer.`)) {
                                try {
                                  await eliminar.mutateAsync(prod.id)
                                  showToast('Producto eliminado')
                                } catch (e: unknown) {
                                  const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al eliminar'
                                  showToast(msg, true)
                                }
                              }
                            }}
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
            {productos.length === 0 && (
              <div className="p-10 text-center text-muted text-sm">
                No se encontraron productos
              </div>
            )}
          </div>
        )}
      </div>

      <ProductoForm
        key={`${modalOpen}-${editing?.id ?? 'new'}`}
        open={modalOpen}
        onClose={() => dispatch({ type: 'CLOSE_MODAL' })}
        onSave={handleSave}
        initial={editing}
        categorias={categorias}
        loading={crear.isPending || editar.isPending}
      />

      {toast && (
        <div className={`fixed bottom-6 right-6 bg-white rounded-xl px-4 py-3 shadow-[0_8px_24px_rgba(44,18,8,0.15)] flex items-center gap-2 font-sans text-sm font-semibold z-50 border-l-[3px] ${toast.error ? 'border-red-600' : 'border-green-700'}`}>
          <span className={`icon icon-fill text-[18px] ${toast.error ? 'text-red-600' : 'text-green-700'}`}>
            {toast.error ? 'error' : 'check_circle'}
          </span>
          {toast.msg}
        </div>
      )}
    </AdminLayout>
  )
}

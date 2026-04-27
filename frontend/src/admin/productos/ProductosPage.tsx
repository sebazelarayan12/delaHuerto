import { useState } from 'react'
import AdminLayout from '../AdminLayout'
import { useProductos } from './hooks/useProductos'
import type { ProductoAdmin } from './hooks/useProductos'
import ProductoForm from './ProductoForm'
import { useCategorias } from '../categorias/hooks/useCategorias'

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

export default function ProductosPage() {
  const { query, crear, editar, toggleDisponible, eliminar } = useProductos()
  const { query: catQuery } = useCategorias()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ProductoAdmin | null>(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState<number | ''>('')
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null)

  const showToast = (msg: string, error = false) => {
    setToast({ msg, error })
    setTimeout(() => setToast(null), 3000)
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
      setModalOpen(false)
      setEditing(null)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al guardar'
      showToast(msg, true)
    }
  }

  const handleToggle = async (prod: ProductoAdmin) => {
    await toggleDisponible.mutateAsync({ id: prod.id, disponible: !prod.disponible })
  }

  const openEdit = (prod: ProductoAdmin) => {
    setEditing(prod)
    setModalOpen(true)
  }

  const openNew = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const productos = (query.data ?? []).filter((p) => {
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === '' || p.categoriaId === filterCat
    return matchSearch && matchCat
  })

  const categorias = catQuery.data ?? []

  return (
    <AdminLayout>
      <div className="px-4 lg:px-8 pt-6 lg:pt-8 pb-5" style={{ borderBottom: '1px solid #E2CFB5', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#2C1208' }}>Productos</h1>
          <p style={{ fontSize: 14, color: '#9A7A66', marginTop: 4 }}>
            {query.data?.length ?? 0} productos en total
          </p>
        </div>
        <button
          onClick={openNew}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none', background: '#C4522A', color: 'white', fontFamily: "'Manrope', sans-serif", fontSize: 13.5, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(196,82,42,0.3)', flexShrink: 0 }}
        >
          <span className="icon icon-fill" style={{ fontSize: 18 }}>add_circle</span>
          <span className="hidden sm:inline">Nuevo producto</span>
          <span className="sm:hidden">Nuevo</span>
        </button>
      </div>

      {/* Filtros: stack en mobile, fila en sm+ */}
      <div className="px-4 lg:px-8 pt-5 pb-2 flex flex-col sm:flex-row gap-3">
        <div style={{ position: 'relative', flex: 1 }}>
          <span className="icon" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9A7A66', fontSize: 18 }}>search</span>
          <input
            type="text"
            placeholder="Buscar producto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 40 }}
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value === '' ? '' : Number(e.target.value))}
          style={{ ...inputStyle, width: '100%' }}
          className="sm:w-56"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      <div className="px-4 lg:px-8 pb-8 pt-2">
        {query.isLoading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9A7A66' }}>Cargando…</div>
        ) : (
          <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 2px 8px rgba(44,18,8,0.06)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Manrope', sans-serif", minWidth: 640 }}>
                <thead>
                  <tr style={{ background: '#FDF6EC' }}>
                    {['Foto', 'Nombre', 'Categoría', 'Precio', 'Estado', 'Disponible', 'Acciones'].map((h) => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9A7A66', borderBottom: '1px solid #E2CFB5', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {productos.map((prod, i) => (
                    <tr key={prod.id} style={{ borderBottom: i < productos.length - 1 ? '1px solid #F3E8D8' : 'none' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: '#F3E8D8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                          {prod.fotoUrl ? (
                            <img src={prod.fotoUrl} alt={prod.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : '🫔'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: '#2C1208', whiteSpace: 'nowrap' }}>{prod.nombre}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#9A7A66', whiteSpace: 'nowrap' }}>{prod.categoria.nombre}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: '#C4522A', whiteSpace: 'nowrap' }}>{fmt(parseFloat(prod.precio))}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: prod.disponible ? '#f0fdf4' : '#fef2f2', color: prod.disponible ? '#15803d' : '#dc2626', whiteSpace: 'nowrap' }}>
                          <span className="icon" style={{ fontSize: 13 }}>{prod.disponible ? 'check_circle' : 'cancel'}</span>
                          {prod.disponible ? 'Disponible' : 'No disponible'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Toggle checked={prod.disponible} onChange={() => handleToggle(prod)} />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => openEdit(prod)}
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 8, border: '1.5px solid #E2CFB5', background: 'transparent', cursor: 'pointer', color: '#7A4020' }}
                            title="Editar"
                          >
                            <span className="icon" style={{ fontSize: 17 }}>edit</span>
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
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 8, border: '1.5px solid #fecaca', background: 'transparent', cursor: 'pointer', color: '#dc2626' }}
                            title="Eliminar"
                          >
                            <span className="icon" style={{ fontSize: 17 }}>delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {productos.length === 0 && (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: '#9A7A66', fontSize: 14 }}>
                No se encontraron productos
              </div>
            )}
          </div>
        )}
      </div>

      <ProductoForm
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={handleSave}
        initial={editing}
        categorias={categorias}
        loading={crear.isPending || editar.isPending}
      />

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'white', borderRadius: 12, padding: '12px 18px', boxShadow: '0 8px 24px rgba(44,18,8,0.15)', display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 600, zIndex: 1000, borderLeft: `3px solid ${toast.error ? '#dc2626' : '#15803d'}` }}>
          <span className="icon icon-fill" style={{ fontSize: 18, color: toast.error ? '#dc2626' : '#15803d' }}>{toast.error ? 'error' : 'check_circle'}</span>
          {toast.msg}
        </div>
      )}
    </AdminLayout>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '10px 13px',
  border: '1.5px solid #E2CFB5',
  borderRadius: 10,
  fontFamily: "'Manrope', sans-serif",
  fontSize: 14,
  color: '#2C1208',
  background: 'white',
  outline: 'none',
  width: '100%',
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ opacity: 0, width: 0, height: 0 }} />
      <span style={{ position: 'absolute', inset: 0, borderRadius: 99, background: checked ? '#C4522A' : '#E2CFB5', transition: 'background 0.2s' }} />
      <span style={{ position: 'absolute', top: 3, left: checked ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
    </label>
  )
}

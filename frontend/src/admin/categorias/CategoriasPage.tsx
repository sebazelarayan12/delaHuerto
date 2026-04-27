import { useState } from 'react'
import AdminLayout from '../AdminLayout'
import { useCategorias } from './hooks/useCategorias'
import type { CategoriaAdmin } from './hooks/useCategorias'
import CategoriaForm from './CategoriaForm'

export default function CategoriasPage() {
  const { query, crear, editar, toggleActiva, eliminar } = useCategorias()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CategoriaAdmin | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async (data: { nombre: string; orden: number; activa: boolean }) => {
    if (editing) {
      await editar.mutateAsync({ id: editing.id, ...data })
      showToast('Categoría actualizada')
    } else {
      await crear.mutateAsync(data)
      showToast('Categoría creada')
    }
    setModalOpen(false)
    setEditing(null)
  }

  const handleToggle = async (cat: CategoriaAdmin) => {
    await toggleActiva.mutateAsync({ id: cat.id, activa: !cat.activa })
  }

  const openEdit = (cat: CategoriaAdmin) => {
    setEditing(cat)
    setModalOpen(true)
  }

  const openNew = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const categorias = query.data ?? []

  return (
    <AdminLayout>
      <div className="px-4 lg:px-8 pt-6 lg:pt-8 pb-5" style={{ borderBottom: '1px solid #E2CFB5', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#2C1208' }}>Categorías</h1>
          <p style={{ fontSize: 14, color: '#9A7A66', marginTop: 4 }}>
            {categorias.length} categorías en total
          </p>
        </div>
        <button
          onClick={openNew}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none', background: '#C4522A', color: 'white', fontFamily: "'Manrope', sans-serif", fontSize: 13.5, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(196,82,42,0.3)', flexShrink: 0 }}
        >
          <span className="icon icon-fill" style={{ fontSize: 18 }}>add_circle</span>
          <span className="hidden sm:inline">Nueva categoría</span>
          <span className="sm:hidden">Nueva</span>
        </button>
      </div>

      <div className="px-4 lg:px-8 py-6">
        {query.isLoading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9A7A66' }}>Cargando…</div>
        ) : (
          <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 2px 8px rgba(44,18,8,0.06)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Manrope', sans-serif", minWidth: 520 }}>
                <thead>
                  <tr style={{ background: '#FDF6EC' }}>
                    {['Nombre', 'Orden', 'Estado', 'Activar / Desactivar', 'Acciones'].map((h) => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9A7A66', borderBottom: '1px solid #E2CFB5', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...categorias].sort((a, b) => a.orden - b.orden).map((cat, i) => (
                    <tr key={cat.id} style={{ borderBottom: i < categorias.length - 1 ? '1px solid #F3E8D8' : 'none' }}>
                      <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: '#2C1208', whiteSpace: 'nowrap' }}>
                        {cat.nombre}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: '#9A7A66', fontWeight: 600 }}>
                        #{cat.orden}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: cat.activa ? '#f0fdf4' : '#fef2f2', color: cat.activa ? '#15803d' : '#dc2626', whiteSpace: 'nowrap' }}>
                          <span className="icon" style={{ fontSize: 13 }}>{cat.activa ? 'check_circle' : 'cancel'}</span>
                          {cat.activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <Toggle checked={cat.activa} onChange={() => handleToggle(cat)} />
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => openEdit(cat)}
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 8, border: '1.5px solid #E2CFB5', background: 'transparent', cursor: 'pointer', color: '#7A4020', transition: 'all 0.15s' }}
                            title="Editar"
                          >
                            <span className="icon" style={{ fontSize: 17 }}>edit</span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Desactivar la categoría "${cat.nombre}"?`)) {
                                eliminar.mutate(cat.id)
                              }
                            }}
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 8, border: '1.5px solid #fecaca', background: 'transparent', cursor: 'pointer', color: '#dc2626', transition: 'all 0.15s' }}
                            title="Desactivar"
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
          </div>
        )}
      </div>

      <CategoriaForm
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={handleSave}
        initial={editing}
        loading={crear.isPending || editar.isPending}
      />

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'white', borderRadius: 12, padding: '12px 18px', boxShadow: '0 8px 24px rgba(44,18,8,0.15)', display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 600, zIndex: 1000, borderLeft: '3px solid #15803d' }}>
          <span className="icon icon-fill" style={{ fontSize: 18, color: '#15803d' }}>check_circle</span>
          {toast}
        </div>
      )}
    </AdminLayout>
  )
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

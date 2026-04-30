import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import AdminLayout from '../AdminLayout'
import { useCategorias } from './hooks/useCategorias'
import type { CategoriaAdmin } from './hooks/useCategorias'
import CategoriaForm from './CategoriaForm'
import Toggle from '../../shared/components/Toggle'

export default function CategoriasPage() {
  const { query, crear, editar, toggleActiva, eliminar, reordenar, syncDescuentos } = useCategorias()
  const [modal, setModal] = useState<{ open: boolean; editing: CategoriaAdmin | null }>({ open: false, editing: null })
  const [localCats, setLocalCats] = useState<CategoriaAdmin[]>([])
  const [draggedId, setDraggedId] = useState<number | null>(null)

  useEffect(() => {
    if (query.data) {
      setLocalCats([...query.data].sort((a, b) => a.orden - b.orden))
    }
  }, [query.data])

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, targetId: number) => {
    e.preventDefault()
    if (draggedId === null || draggedId === targetId) return
    const draggedIdx = localCats.findIndex((c) => c.id === draggedId)
    const targetIdx = localCats.findIndex((c) => c.id === targetId)
    const newCats = [...localCats]
    const [draggedCat] = newCats.splice(draggedIdx, 1)
    newCats.splice(targetIdx, 0, draggedCat)
    setLocalCats(newCats)
  }

  const handleDragEnd = async () => {
    if (draggedId === null) return
    setDraggedId(null)
    const originalOrder = [...(query.data ?? [])].sort((a, b) => a.orden - b.orden)
    const changed = localCats.some((c, i) => c.id !== originalOrder[i]?.id)
    if (!changed) return

    const ordenes = localCats.map((c, i) => ({ id: c.id, orden: i }))
    try {
      await reordenar.mutateAsync(ordenes)
      toast.success('Orden actualizado')
    } catch {
      toast.error('Error al reordenar')
      setLocalCats([...originalOrder])
    }
  }

  const handleSave = async (
    data: { nombre: string; orden: number; activa: boolean },
    tiers: { cantidadMinima: number; porcentaje: number }[]
  ) => {
    try {
      let savedId: number
      if (modal.editing) {
        const res = await editar.mutateAsync({ id: modal.editing.id, ...data })
        savedId = (res.data as { id: number }).id ?? modal.editing.id
      } else {
        const res = await crear.mutateAsync(data)
        savedId = (res.data as { id: number }).id
      }
      await syncDescuentos.mutateAsync({ id: savedId, tiers })
      toast.success(modal.editing ? 'Categoria actualizada' : 'Categoria creada')
      setModal({ open: false, editing: null })
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al guardar'
      toast.error(msg)
    }
  }

  const handleToggle = async (cat: CategoriaAdmin) => {
    await toggleActiva.mutateAsync({ id: cat.id, activa: !cat.activa })
  }

  const openEdit = (cat: CategoriaAdmin) => {
    setModal({ open: true, editing: cat })
  }

  const openNew = () => {
    setModal({ open: true, editing: null })
  }

  const categorias = query.data ?? []
  const nextOrden = localCats.length > 0 ? Math.max(...localCats.map((c) => c.orden)) + 1 : 0

  return (
    <AdminLayout>
      <div className="px-4 lg:px-8 pt-6 lg:pt-8 pb-5 border-b border-sand-deep flex justify-between items-start gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold text-espresso">Categorías</h1>
          <p className="text-sm text-muted mt-1">
            {categorias.length} categorías en total
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] border-none bg-terra text-white font-sans text-sm font-semibold cursor-pointer shadow-[0_2px_8px_rgba(196,82,42,0.3)] shrink-0 transition-opacity hover:opacity-90"
        >
          <span className="icon icon-fill text-[18px]">add_circle</span>
          <span className="hidden sm:inline">Nueva categoría</span>
          <span className="sm:hidden">Nueva</span>
        </button>
      </div>

      <div className="px-4 lg:px-8 py-6">
        {query.isLoading ? (
          <div className="text-center p-10 text-muted">Cargando…</div>
        ) : (
          <div className="bg-white rounded-[14px] shadow-[0_2px_8px_rgba(44,18,8,0.06)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-sans min-w-[520px]">
                <thead>
                  <tr className="bg-gold-light">
                    {['', 'Nombre', 'Orden', 'Descuentos', 'Estado', 'Activar / Desactivar', 'Acciones'].map((h) => (
                      <th key={h || 'empty'} className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.08em] text-muted border-b border-sand-deep whitespace-nowrap ${h === '' ? 'w-10' : 'w-auto'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {localCats.map((cat, i) => (
                    <tr
                      key={cat.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, cat.id)}
                      onDragOver={(e) => handleDragOver(e, cat.id)}
                      onDragEnd={handleDragEnd}
                      className={`cursor-grab transition-all duration-200 ${i < localCats.length - 1 ? 'border-b border-sand' : ''} ${draggedId === cat.id ? 'bg-ivory opacity-60' : 'bg-transparent'}`}
                    >
                      <td className="px-4 py-3.5 w-10">
                        <span className="icon text-sand-deep text-[20px]">drag_indicator</span>
                      </td>
                      <td className="px-4 py-3.5 text-sm font-bold text-espresso whitespace-nowrap">
                        {cat.nombre}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-muted font-semibold">
                        #{cat.orden}
                      </td>
                      <td className="px-4 py-3.5">
                        {cat.descuentos?.length ? (
                          <div className="flex flex-col gap-0.5">
                            {[...cat.descuentos]
                              .sort((a, b) => a.cantidadMinima - b.cantidadMinima)
                              .map((d) => (
                                <span key={d.id} className="text-xs font-semibold text-brown whitespace-nowrap">
                                  {d.cantidadMinima}+: {d.porcentaje}%
                                </span>
                              ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted">Sin descuentos</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${cat.activa ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          <span className="icon text-[13px]">{cat.activa ? 'check_circle' : 'cancel'}</span>
                          {cat.activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <Toggle checked={cat.activa} onChange={() => handleToggle(cat)} label={cat.activa ? 'Desactivar categoría' : 'Activar categoría'} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openEdit(cat)}
                            className="inline-flex items-center justify-center w-[34px] h-[34px] rounded-lg border-[1.5px] border-sand-deep bg-transparent cursor-pointer text-brown transition-colors hover:bg-sand"
                            title="Editar"
                          >
                            <span className="icon text-[17px]">edit</span>
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`¿Eliminar definitivamente la categoría "${cat.nombre}"? Esta acción no se puede deshacer.`)) {
                                try {
                                  await eliminar.mutateAsync(cat.id)
                                  toast.success('Categoria eliminada')
                                } catch (e: unknown) {
                                  const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al eliminar'
                                  toast.error(msg)
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
          </div>
        )}
      </div>

      <CategoriaForm
        key={`${modal.open}-${modal.editing?.id ?? 'new'}`}
        open={modal.open}
        onClose={() => setModal({ open: false, editing: null })}
        onSave={handleSave}
        initial={modal.editing}
        loading={crear.isPending || editar.isPending}
        nextOrden={nextOrden}
      />

    </AdminLayout>
  )
}

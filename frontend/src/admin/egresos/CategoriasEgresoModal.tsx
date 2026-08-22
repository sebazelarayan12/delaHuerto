import { useState } from 'react'
import { toast } from 'sonner'
import { useCategoriasEgreso } from './hooks/useCategoriasEgreso'
import type { CategoriaEgresoAdmin } from './hooks/useCategoriasEgreso'
import Toggle from '../../shared/components/Toggle'

interface Props {
  open: boolean
  onClose: () => void
}

export default function CategoriasEgresoModal({ open, onClose }: Props) {
  const { query, crear, editar, eliminar } = useCategoriasEgreso()
  const [nombre, setNombre] = useState('')

  if (!open) return null

  const categorias = query.data ?? []

  const handleCrear = async () => {
    if (!nombre.trim()) return
    try {
      await crear.mutateAsync({ nombre: nombre.trim(), activa: true })
      setNombre('')
      toast.success('Categoria creada')
    } catch {
      toast.error('Error al crear categoria')
    }
  }

  const handleToggle = async (cat: CategoriaEgresoAdmin) => {
    await editar.mutateAsync({ id: cat.id, activa: !cat.activa })
  }

  const handleEliminar = async (cat: CategoriaEgresoAdmin) => {
    try {
      await eliminar.mutateAsync(cat.id)
      toast.success(`"${cat.nombre}" eliminada`)
    } catch {
      toast.error('Error al eliminar categoria')
    }
  }

  return (
    <div
      className="fixed inset-0 bg-espresso/50 z-50 flex items-center justify-center p-5 font-sans"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
    >
      <div className="bg-white rounded-[18px] w-full max-w-[420px] shadow-[0_20px_60px_rgba(44,18,8,0.2)] overflow-hidden max-h-[80vh] flex flex-col">
        <div className="py-5 px-6 border-b border-sand flex items-center justify-between shrink-0">
          <h2 className="text-lg font-extrabold text-espresso">Categorias de egreso</h2>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-muted flex items-center transition-colors hover:text-brown">
            <span className="icon">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex flex-col gap-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Insumos"
              className="flex-1 px-[13px] py-2.5 border-[1.5px] border-sand-deep rounded-[10px] font-sans text-sm text-espresso bg-cream outline-none focus:border-terra"
            />
            <button
              onClick={handleCrear}
              disabled={crear.isPending || !nombre.trim()}
              className="px-4 py-2.5 rounded-[10px] border-none bg-terra text-white font-sans text-sm font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Agregar
            </button>
          </div>

          {query.isLoading ? (
            <p className="text-sm text-muted">Cargando categorias...</p>
          ) : categorias.length === 0 ? (
            <p className="text-sm text-muted">Sin categorias todavia.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {categorias.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] border-[1.5px] border-sand-deep">
                  <span className="flex-1 text-sm font-semibold text-espresso">{cat.nombre}</span>
                  <Toggle checked={cat.activa} onChange={() => handleToggle(cat)} label={cat.activa ? 'Desactivar' : 'Activar'} />
                  <button
                    onClick={() => handleEliminar(cat)}
                    className="inline-flex items-center justify-center w-[30px] h-[30px] rounded-lg border-[1.5px] border-red-200 bg-transparent cursor-pointer text-red-600 transition-colors hover:bg-red-50"
                    title="Eliminar"
                  >
                    <span className="icon text-[16px]">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

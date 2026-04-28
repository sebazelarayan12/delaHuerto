import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { CategoriaAdmin } from './hooks/useCategorias'
import Toggle from '../../shared/components/Toggle'

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  orden: z.coerce.number().default(0),
  activa: z.boolean().default(true),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: FormData) => void
  initial?: CategoriaAdmin | null
  loading?: boolean
}

export default function CategoriaForm({ open, onClose, onSave, initial, loading }: Props) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? { nombre: initial.nombre, orden: initial.orden, activa: initial.activa }
      : { nombre: '', orden: 0, activa: true },
  })

  const activa = watch('activa')

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-[#2C1208]/50 z-50 flex items-center justify-center p-5 font-sans"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
    >
      <div className="bg-white rounded-[18px] w-full max-w-[480px] shadow-[0_20px_60px_rgba(44,18,8,0.2)] overflow-hidden">
        <div className="py-5 px-6 border-b border-sand flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-espresso">
            {initial ? 'Editar categoría' : 'Nueva categoría'}
          </h2>
          <button
            onClick={onClose}
            className="bg-transparent border-none cursor-pointer text-muted flex items-center transition-colors hover:text-brown"
          >
            <span className="icon">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="p-6">
          <div className="mb-4">
            <label htmlFor="cat-nombre" className="block text-xs font-bold uppercase tracking-[0.08em] text-brown mb-1.5">Nombre de la categoría</label>
            <input
              id="cat-nombre"
              type="text"
              placeholder="Ej: Empanadas Fritas"
              {...register('nombre')}
              className="w-full px-[13px] py-2.5 border-[1.5px] border-sand-deep rounded-[10px] font-sans text-sm text-espresso bg-cream outline-none focus:border-terra"
            />
            {errors.nombre && <span className="text-xs text-red-600 mt-1 block">{errors.nombre.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-3.5 mb-4">
            <div>
              <label htmlFor="cat-orden" className="block text-xs font-bold uppercase tracking-[0.08em] text-brown mb-1.5">Orden</label>
              <input
                id="cat-orden"
                type="number"
                min="0"
                {...register('orden')}
                className="w-full px-[13px] py-2.5 border-[1.5px] border-sand-deep rounded-[10px] font-sans text-sm text-espresso bg-cream outline-none focus:border-terra"
              />
            </div>
            <div>
              <label htmlFor="cat-activa" className="block text-xs font-bold uppercase tracking-[0.08em] text-brown mb-1.5">Estado</label>
              <div className="flex items-center gap-2.5 mt-1 h-[44px]">
                <Toggle
                  checked={activa}
                  onChange={() => setValue('activa', !activa)}
                  label={activa ? 'Desactivar categoría' : 'Activar categoría'}
                />
                <span className={`text-[13px] font-semibold ${activa ? 'text-green-700' : 'text-muted'}`}>
                  {activa ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-sand">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-[10px] border-[1.5px] border-sand-deep bg-transparent font-sans text-sm font-semibold text-brown cursor-pointer transition-colors hover:bg-sand"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2.5 rounded-[10px] border-none font-sans text-sm font-semibold flex items-center gap-1.5 shadow-[0_2px_8px_rgba(196,82,42,0.3)] transition-colors ${loading ? 'bg-sand-deep text-white cursor-not-allowed' : 'bg-terra text-white cursor-pointer hover:bg-terra-dark'}`}
            >
              <span className="icon icon-fill text-[17px]">save</span>
              {initial ? 'Guardar cambios' : 'Crear categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

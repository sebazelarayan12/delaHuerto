import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { CategoriaEgresoAdmin } from './hooks/useCategoriasEgreso'
import NumberField from '../../shared/components/NumberField'

const schema = z.object({
  categoriaId: z.coerce.number().int().positive({ message: 'Seleccionar categoria' }),
  monto: z.coerce.number().positive({ message: 'Monto requerido' }),
  descripcion: z.string().optional(),
  fecha: z.string().min(1, { message: 'Fecha requerida' }),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: FormData) => void
  categorias: CategoriaEgresoAdmin[]
  loading?: boolean
}

export default function EgresoForm({ open, onClose, onSave, categorias, loading }: Props) {
  const hoy = new Date().toISOString().split('T')[0]
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { categoriaId: 0, monto: 0, descripcion: '', fecha: hoy },
  })

  if (!open) return null

  const activas = categorias.filter((c) => c.activa)

  return (
    <div
      className="fixed inset-0 bg-espresso/50 z-50 flex items-center justify-center p-5 font-sans"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
    >
      <div className="bg-white rounded-[18px] w-full max-w-[420px] shadow-[0_20px_60px_rgba(44,18,8,0.2)] overflow-hidden max-h-[90vh] flex flex-col">
        <div className="py-5 px-6 border-b border-sand flex items-center justify-between shrink-0">
          <h2 className="text-lg font-extrabold text-espresso">Registrar egreso</h2>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-muted flex items-center transition-colors hover:text-brown">
            <span className="icon">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="p-6 overflow-y-auto flex flex-col gap-4">
          <div>
            <label htmlFor="eg-categoria" className="block text-xs font-bold uppercase tracking-[0.08em] text-brown mb-1.5">Categoria</label>
            <select
              id="eg-categoria"
              {...register('categoriaId')}
              className="w-full px-[13px] py-2.5 border-[1.5px] border-sand-deep rounded-[10px] font-sans text-sm text-espresso bg-cream outline-none focus:border-terra"
            >
              <option value={0}>Seleccionar...</option>
              {activas.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            {errors.categoriaId && <span className="text-xs text-red-600 mt-1 block">{errors.categoriaId.message}</span>}
          </div>

          <div>
            <label htmlFor="eg-monto" className="block text-xs font-bold uppercase tracking-[0.08em] text-brown mb-1.5">Monto</label>
            <Controller
              control={control}
              name="monto"
              render={({ field }) => (
                <NumberField id="eg-monto" value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} className="w-full px-[13px] py-2.5 border-[1.5px] border-sand-deep rounded-[10px] font-sans text-sm text-espresso bg-cream outline-none focus:border-terra" />
              )}
            />
            {errors.monto && <span className="text-xs text-red-600 mt-1 block">{errors.monto.message}</span>}
          </div>

          <div>
            <label htmlFor="eg-descripcion" className="block text-xs font-bold uppercase tracking-[0.08em] text-brown mb-1.5">Descripcion (opcional)</label>
            <input
              id="eg-descripcion"
              type="text"
              placeholder="Ej: Compra de harina"
              {...register('descripcion')}
              className="w-full px-[13px] py-2.5 border-[1.5px] border-sand-deep rounded-[10px] font-sans text-sm text-espresso bg-cream outline-none focus:border-terra"
            />
          </div>

          <div>
            <label htmlFor="eg-fecha" className="block text-xs font-bold uppercase tracking-[0.08em] text-brown mb-1.5">Fecha</label>
            <input
              id="eg-fecha"
              type="date"
              {...register('fecha')}
              className="w-full px-[13px] py-2.5 border-[1.5px] border-sand-deep rounded-[10px] font-sans text-sm text-espresso bg-cream outline-none focus:border-terra"
            />
            {errors.fecha && <span className="text-xs text-red-600 mt-1 block">{errors.fecha.message}</span>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full p-3.5 border-none rounded-[12px] text-white font-sans text-sm font-bold cursor-pointer bg-terra disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : 'Guardar egreso'}
          </button>
        </form>
      </div>
    </div>
  )
}

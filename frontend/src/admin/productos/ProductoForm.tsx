import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { CategoriaAdmin } from '../categorias/hooks/useCategorias'
import type { ProductoAdmin } from './hooks/useProductos'
import ImageUpload from '../../shared/components/ImageUpload'
import Toggle from '../../shared/components/Toggle'

const schema = z.object({
  categoriaId: z.coerce.number().min(1, 'Selecciona una categoria'),
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  precio: z.coerce.number().positive('El precio debe ser mayor a 0'),
  disponible: z.boolean().default(true),
  orden: z.coerce.number().default(0),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: FormData, foto: File | null) => void
  initial?: ProductoAdmin | null
  categorias: CategoriaAdmin[]
  loading?: boolean
  nextOrden?: number
}

export default function ProductoForm({ open, onClose, onSave, initial, categorias, loading, nextOrden = 0 }: Props) {
  const [foto, setFoto] = useState<File | null>(null)
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? {
          categoriaId: initial.categoriaId,
          nombre: initial.nombre,
          descripcion: initial.descripcion ?? '',
          precio: parseFloat(initial.precio),
          disponible: initial.disponible,
          orden: initial.orden,
        }
      : { nombre: '', orden: nextOrden, disponible: true, descripcion: '', precio: undefined },
  })

  const disponible = watch('disponible')

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-[#2C1208]/50 z-50 flex items-center justify-center p-5 font-sans"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
    >
      <div className="bg-white rounded-[18px] w-full max-w-[600px] max-h-[90vh] overflow-y-auto shadow-[0_20px_60px_rgba(44,18,8,0.2)] flex flex-col">
        <div className="py-5 px-6 border-b border-sand flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-espresso">
            {initial ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-muted flex items-center transition-colors hover:text-brown">
            <span className="icon">close</span>
          </button>
        </div>

        <form
          onSubmit={handleSubmit((data) => onSave(data, foto))}
          className="p-6 overflow-y-auto flex flex-col gap-0"
        >
          <div className="mb-4">
            <label htmlFor="prod-categoria" className="block text-xs font-bold uppercase tracking-[0.08em] text-brown mb-1.5">Categoría</label>
            <select id="prod-categoria" {...register('categoriaId')} className="w-full px-[13px] py-2.5 border-[1.5px] border-sand-deep rounded-[10px] font-sans text-sm text-espresso bg-cream outline-none focus:border-terra">
              <option value="">Seleccioná una categoría</option>
              {categorias.filter((c) => c.activa).map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            {errors.categoriaId && <span className="text-xs text-red-600 mt-1 block">{errors.categoriaId.message}</span>}
          </div>

          <div className="mb-4">
            <label htmlFor="prod-nombre" className="block text-xs font-bold uppercase tracking-[0.08em] text-brown mb-1.5">Nombre</label>
            <input id="prod-nombre" type="text" placeholder="Carne cortada a cuchillo" {...register('nombre')} className="w-full px-[13px] py-2.5 border-[1.5px] border-sand-deep rounded-[10px] font-sans text-sm text-espresso bg-cream outline-none focus:border-terra" />
            {errors.nombre && <span className="text-xs text-red-600 mt-1 block">{errors.nombre.message}</span>}
          </div>

          <div className="mb-4">
            <label htmlFor="prod-descripcion" className="block text-xs font-bold uppercase tracking-[0.08em] text-brown mb-1.5">Descripción (opcional)</label>
            <textarea
              id="prod-descripcion"
              placeholder="Descripción del producto…"
              {...register('descripcion')}
              className="w-full px-[13px] py-2.5 border-[1.5px] border-sand-deep rounded-[10px] font-sans text-sm text-espresso bg-cream outline-none focus:border-terra resize-none h-[72px]"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="prod-precio" className="block text-xs font-bold uppercase tracking-[0.08em] text-brown mb-1.5">Precio</label>
            <input id="prod-precio" type="number" step="0.01" placeholder="5500" {...register('precio')} className="w-full px-[13px] py-2.5 border-[1.5px] border-sand-deep rounded-[10px] font-sans text-sm text-espresso bg-cream outline-none focus:border-terra" />
            {errors.precio && <span className="text-xs text-red-600 mt-1 block">{errors.precio.message}</span>}
          </div>

          <input type="hidden" {...register('orden')} />

          <div className="mb-4">
            <label htmlFor="prod-disponible" className="block text-xs font-bold uppercase tracking-[0.08em] text-brown mb-1.5">Disponible</label>
            <div className="flex items-center gap-2.5 mt-1 h-[44px]">
              <Toggle
                checked={disponible}
                onChange={() => setValue('disponible', !disponible)}
                label={disponible ? 'Marcar no disponible' : 'Marcar disponible'}
              />
              <span className={`text-[13px] font-semibold ${disponible ? 'text-green-700' : 'text-muted'}`}>
                {disponible ? 'Disponible' : 'No disponible'}
              </span>
            </div>
          </div>

          <div className="mb-5">
            <label htmlFor="prod-foto" className="block text-xs font-bold uppercase tracking-[0.08em] text-brown mb-1.5">Foto del producto</label>
            <ImageUpload currentUrl={initial?.fotoUrl} onFileChange={setFoto} />
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
              {initial ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { CategoriaAdmin, DescuentoTier } from './hooks/useCategorias'
import Toggle from '../../shared/components/Toggle'

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  orden: z.coerce.number().default(0),
  activa: z.boolean().default(true),
})

type FormData = z.infer<typeof schema>

interface TierForm {
  id: number
  cantidadMinima: number | ''
  porcentaje: number | ''
}

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: FormData, tiers: { cantidadMinima: number; porcentaje: number }[]) => void
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

  const [tiers, setTiers] = useState<TierForm[]>(
    initial?.descuentos?.length
      ? initial.descuentos.map((d: DescuentoTier) => ({ id: d.id, cantidadMinima: d.cantidadMinima, porcentaje: d.porcentaje }))
      : []
  )

  const [tierErrors, setTierErrors] = useState<string[]>([])

  const addTier = () => setTiers((prev) => [...prev, { id: Date.now(), cantidadMinima: '', porcentaje: '' }])

  const removeTier = (idx: number) => {
    setTiers((prev) => prev.filter((_, i) => i !== idx))
    setTierErrors((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateTier = (idx: number, field: keyof TierForm, value: string) => {
    setTiers((prev) => prev.map((t, i) => i === idx ? { ...t, [field]: value === '' ? '' : Number(value) } : t))
  }

  const validateTiers = (): { cantidadMinima: number; porcentaje: number }[] | null => {
    const errs: string[] = []
    const validated: { cantidadMinima: number; porcentaje: number }[] = []
    for (const t of tiers) {
      if (t.cantidadMinima === '' || t.porcentaje === '') { errs.push('Completar cantidad y porcentaje'); continue }
      if (Number(t.cantidadMinima) < 1) { errs.push('Cantidad minima debe ser mayor a 0'); continue }
      if (Number(t.porcentaje) <= 0 || Number(t.porcentaje) > 100) { errs.push('Porcentaje entre 1 y 100'); continue }
      errs.push('')
      validated.push({ cantidadMinima: Number(t.cantidadMinima), porcentaje: Number(t.porcentaje) })
    }
    setTierErrors(errs)
    if (errs.some((e) => e !== '')) return null
    return validated
  }

  const handleFormSubmit = (data: FormData) => {
    const validatedTiers = validateTiers()
    if (validatedTiers === null) return
    onSave(data, validatedTiers)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-[#2C1208]/50 z-50 flex items-center justify-center p-5 font-sans"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
    >
      <div className="bg-white rounded-[18px] w-full max-w-[520px] shadow-[0_20px_60px_rgba(44,18,8,0.2)] overflow-hidden max-h-[90vh] flex flex-col">
        <div className="py-5 px-6 border-b border-sand flex items-center justify-between shrink-0">
          <h2 className="text-lg font-extrabold text-espresso">
            {initial ? 'Editar categoría' : 'Nueva categoría'}
          </h2>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-muted flex items-center transition-colors hover:text-brown">
            <span className="icon">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 overflow-y-auto flex flex-col gap-0">
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

          <div className="grid grid-cols-2 gap-3.5 mb-5">
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

          {/* Descuentos por mayor */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-brown">Descuentos por mayor</span>
              <button
                type="button"
                onClick={addTier}
                className="inline-flex items-center gap-1 text-xs font-semibold text-terra border-[1.5px] border-terra rounded-lg px-2.5 py-1 bg-transparent cursor-pointer transition-colors hover:bg-terra-light"
              >
                <span className="icon icon-fill text-[15px]">add_circle</span>
                Agregar descuento
              </button>
            </div>

            {tiers.length === 0 ? (
              <p className="text-xs text-muted italic">Sin descuentos configurados para esta categoría.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {tiers.map((tier, idx) => (
                  <div key={tier.id} className="flex items-center gap-2">
                    <div className="flex-1">
                      <input
                        type="number"
                        min="1"
                        placeholder="Min. docenas"
                        value={tier.cantidadMinima}
                        onChange={(e) => updateTier(idx, 'cantidadMinima', e.target.value)}
                        className="w-full px-3 py-2 border-[1.5px] border-sand-deep rounded-lg font-sans text-sm text-espresso bg-cream outline-none focus:border-terra"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          step="0.1"
                          placeholder="Descuento %"
                          value={tier.porcentaje}
                          onChange={(e) => updateTier(idx, 'porcentaje', e.target.value)}
                          className="w-full px-3 py-2 pr-7 border-[1.5px] border-sand-deep rounded-lg font-sans text-sm text-espresso bg-cream outline-none focus:border-terra"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-muted font-semibold">%</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTier(idx)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border-[1.5px] border-red-200 bg-transparent cursor-pointer text-red-600 transition-colors hover:bg-red-50 shrink-0"
                    >
                      <span className="icon text-[16px]">delete</span>
                    </button>
                    {tierErrors[idx] && (
                      <span className="text-xs text-red-600 absolute mt-7">{tierErrors[idx]}</span>
                    )}
                  </div>
                ))}
                {tierErrors.some((e) => e) && (
                  <p className="text-xs text-red-600 mt-1">Verificar los valores ingresados.</p>
                )}
              </div>
            )}
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

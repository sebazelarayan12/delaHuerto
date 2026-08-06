import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/axios'
import type { ProductoAdmin } from '../productos/hooks/useProductos'
import type { ItemVentaInput } from './hooks/useVentas'

const itemSchema = z.object({
  productoId: z.coerce.number().int().positive({ message: 'Seleccionar producto' }),
  cantidad: z.coerce.number().int().min(1, { message: 'Minimo 1' }),
  precioUnitario: z.coerce.number().positive({ message: 'Precio requerido' }),
})

const ventaSchema = z.object({
  items: z.array(itemSchema).min(1, { message: 'Agregar al menos un producto' }),
  notas: z.string().optional(),
  fecha: z.string().min(1, { message: 'Fecha requerida' }),
})

type VentaFormData = z.infer<typeof ventaSchema>

interface Props {
  onClose: () => void
  onSave: (items: ItemVentaInput[], notas?: string, fecha?: string) => void
  loading: boolean
}

export default function VentaForm({ onClose, onSave, loading }: Props) {
  const { data: productos = [] } = useQuery<ProductoAdmin[]>({
    queryKey: ['productos', 'admin'],
    queryFn: async () => (await api.get<ProductoAdmin[]>('/api/admin/productos')).data,
  })

  const hoy = new Date().toISOString().split('T')[0]

  const form = useForm<VentaFormData>({
    resolver: zodResolver(ventaSchema),
    defaultValues: { items: [{ productoId: 0, cantidad: 1, precioUnitario: 0 }], notas: '', fecha: hoy },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  const watchedItems = form.watch('items')

  const total = watchedItems.reduce((acc, item) => {
    return acc + (Number(item.precioUnitario) || 0) * (Number(item.cantidad) || 0)
  }, 0)

  const handleProductoChange = (index: number, productoId: number) => {
    const prod = productos.find((p) => p.id === productoId)
    if (prod) form.setValue(`items.${index}.precioUnitario`, parseFloat(prod.precio))
  }

  const onSubmit = (data: VentaFormData) => {
    onSave(
      data.items.map((i) => ({
        productoId: Number(i.productoId),
        cantidad: Number(i.cantidad),
        precioUnitario: Number(i.precioUnitario),
      })),
      data.notas || undefined,
      data.fecha
    )
  }

  const fmt = (n: number) => '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 0 })

  return (
    <div
      className="fixed inset-0 bg-espresso/50 z-50 flex items-center justify-center p-5 font-sans"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
    >
      <div className="bg-white rounded-[18px] w-full max-w-[600px] shadow-[0_20px_60px_rgba(44,18,8,0.2)] overflow-hidden max-h-[90vh] flex flex-col">
        <div className="py-5 px-6 border-b border-sand flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold text-espresso">Registrar venta</h2>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-muted flex items-center transition-colors hover:text-brown">
            <span className="icon">close</span>
          </button>
        </div>

        <form id="venta-form" onSubmit={form.handleSubmit(onSubmit)} className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-brown">Productos</span>
              <button
                type="button"
                onClick={() => append({ productoId: 0, cantidad: 1, precioUnitario: 0 })}
                className="inline-flex items-center gap-1 text-xs font-semibold text-terra border-[1.5px] border-terra rounded-lg px-2.5 py-1 bg-transparent cursor-pointer transition-colors hover:bg-terra-light"
              >
                <span className="icon icon-fill text-[15px]">add_circle</span>
                Agregar
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {fields.map((field, index) => {
                const cantidad = Number(watchedItems[index]?.cantidad) || 0
                const precio = Number(watchedItems[index]?.precioUnitario) || 0
                const subtotal = cantidad * precio
                const errs = form.formState.errors.items?.[index]

                return (
                  <div key={field.id} className="flex flex-col gap-2 p-3 rounded-xl bg-sand/30 border border-sand">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        {...form.register(`items.${index}.productoId`)}
                        onChange={(e) => {
                          form.setValue(`items.${index}.productoId`, Number(e.target.value))
                          handleProductoChange(index, Number(e.target.value))
                        }}
                        className="flex-1 px-3 py-2 border-[1.5px] border-sand-deep rounded-[10px] font-sans text-sm text-espresso bg-cream outline-none focus:border-terra"
                      >
                        <option value={0}>Seleccionar producto</option>
                        {productos.map((p) => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        placeholder="Cant."
                        {...form.register(`items.${index}.cantidad`)}
                        className="w-full sm:w-20 px-3 py-2 border-[1.5px] border-sand-deep rounded-[10px] font-sans text-sm text-espresso bg-cream outline-none focus:border-terra text-center"
                      />

                      <div className="relative w-full sm:w-28">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted font-semibold">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Precio"
                          {...form.register(`items.${index}.precioUnitario`)}
                          className="w-full pl-6 pr-3 py-2 border-[1.5px] border-sand-deep rounded-[10px] font-sans text-sm text-espresso bg-cream outline-none focus:border-terra"
                        />
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2">
                        <span className="text-sm font-bold text-terra sm:w-24 sm:text-right">{fmt(subtotal)}</span>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="size-8 flex items-center justify-center rounded-lg border-[1.5px] border-red-200 bg-transparent cursor-pointer text-red-600 hover:bg-red-50 shrink-0"
                          >
                            <span className="icon text-[16px]">delete</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {(errs?.productoId || errs?.cantidad || errs?.precioUnitario) && (
                      <p className="text-xs text-red-600">
                        {errs?.productoId?.message ?? errs?.cantidad?.message ?? errs?.precioUnitario?.message}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            {form.formState.errors.items?.root && (
              <p className="text-xs text-red-600 mt-1">{form.formState.errors.items.root.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-terra/5 border border-terra/20">
            <span className="text-sm font-bold text-brown uppercase tracking-[0.06em]">Total</span>
            <span className="font-display text-[22px] font-extrabold text-terra">{fmt(total)}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="venta-fecha" className="block text-xs font-bold uppercase tracking-[0.08em] text-brown mb-1.5">
                Fecha
              </label>
              <input
                id="venta-fecha"
                type="date"
                {...form.register('fecha')}
                className="w-full px-[13px] py-2.5 border-[1.5px] border-sand-deep rounded-[10px] font-sans text-sm text-espresso bg-cream outline-none focus:border-terra"
              />
              {form.formState.errors.fecha && (
                <p className="text-xs text-red-600 mt-1">{form.formState.errors.fecha.message}</p>
              )}
            </div>

            <div className="flex-[2]">
              <label htmlFor="venta-notas" className="block text-xs font-bold uppercase tracking-[0.08em] text-brown mb-1.5">
                Notas (opcional)
              </label>
              <input
                id="venta-notas"
                type="text"
                placeholder="Ej: Cliente Juan, pago en efectivo"
                {...form.register('notas')}
                className="w-full px-[13px] py-2.5 border-[1.5px] border-sand-deep rounded-[10px] font-sans text-sm text-espresso bg-cream outline-none focus:border-terra"
              />
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-sand shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-[10px] border-[1.5px] border-sand-deep bg-transparent font-sans text-sm font-semibold text-brown cursor-pointer transition-colors hover:bg-sand"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="venta-form"
            disabled={loading}
            className={`px-4 py-2.5 rounded-[10px] border-none font-sans text-sm font-semibold flex items-center gap-1.5 shadow-[0_2px_8px_rgba(196,82,42,0.3)] transition-colors ${loading ? 'bg-sand-deep text-white cursor-not-allowed' : 'bg-terra text-white cursor-pointer hover:bg-terra-dark'}`}
          >
            <span className="icon icon-fill text-[17px]">point_of_sale</span>
            Registrar venta
          </button>
        </div>
      </div>
    </div>
  )
}

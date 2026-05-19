import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/axios'
import type { ProductoAdmin } from '../productos/hooks/useProductos'
import type { CreatePedidoInput } from './hooks/usePedidos'
import {
  toYMD,
  getDeliveryDayWarning,
  getEnabledDaysHint,
} from './helpers/pedido.helpers'

const STORAGE_KEY = 'huerto_delivery_days'
const DEFAULT_DAYS: boolean[] = [true, true, true, true, true, true, false]

function loadDeliveryDays(): boolean[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (Array.isArray(parsed) && parsed.length === 7) return parsed
  } catch {}
  return [...DEFAULT_DAYS]
}

const itemSchema = z.object({
  productoId: z.coerce.number().int().positive({ message: 'Seleccionar producto' }),
  cantidad: z.coerce.number().int().min(1, { message: 'Minimo 1' }),
  precioUnitario: z.coerce.number().positive({ message: 'Precio requerido' }),
})

const pedidoSchema = z.object({
  nombre: z.string().min(1, { message: 'Requerido' }),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  notas: z.string().optional(),
  fechaEntrega: z.string().min(1, { message: 'Requerida' }),
  items: z.array(itemSchema).min(1, { message: 'Agregar al menos un producto' }),
})

type PedidoFormData = z.infer<typeof pedidoSchema>

interface Props {
  onClose: () => void
  onSave: (data: CreatePedidoInput) => void
  loading: boolean
}

export default function PedidoForm({ onClose, onSave, loading }: Props) {
  const deliveryDays = loadDeliveryDays()
  const todayStr = toYMD(new Date())

  const { data: productos = [] } = useQuery<ProductoAdmin[]>({
    queryKey: ['productos', 'admin'],
    queryFn: async () => (await api.get<ProductoAdmin[]>('/api/admin/productos')).data,
  })

  const form = useForm<PedidoFormData>({
    resolver: zodResolver(pedidoSchema),
    defaultValues: {
      nombre: '',
      telefono: '',
      direccion: '',
      notas: '',
      fechaEntrega: todayStr,
      items: [{ productoId: 0, cantidad: 1, precioUnitario: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' })
  const watchedItems = form.watch('items')
  const watchedFecha = form.watch('fechaEntrega')

  const total = watchedItems.reduce(
    (acc, item) => acc + (Number(item.precioUnitario) || 0) * (Number(item.cantidad) || 0),
    0
  )

  const dateWarning = getDeliveryDayWarning(watchedFecha, deliveryDays)
  const enabledHint = getEnabledDaysHint(deliveryDays)

  const handleProductoChange = (index: number, productoId: number) => {
    const prod = productos.find((p) => p.id === productoId)
    if (prod) form.setValue(`items.${index}.precioUnitario`, parseFloat(prod.precio))
  }

  const onSubmit = (data: PedidoFormData) => {
    onSave({
      nombre: data.nombre,
      telefono: data.telefono || undefined,
      direccion: data.direccion || undefined,
      notas: data.notas || undefined,
      fechaEntrega: data.fechaEntrega,
      items: data.items.map((i) => ({
        productoId: Number(i.productoId),
        cantidad: Number(i.cantidad),
        precioUnitario: Number(i.precioUnitario),
      })),
    })
  }

  const fmt = (n: number) => '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 0 })

  return (
    <div
      className="fixed inset-0 bg-espresso/50 z-50 flex items-center justify-center p-5 font-sans"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
    >
      <div className="bg-white rounded-[20px] w-full max-w-[640px] shadow-[0_28px_72px_rgba(44,18,8,0.3)] overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="py-[22px] px-[26px] border-b border-sand flex items-center justify-between shrink-0">
          <span className="font-display text-[22px] font-extrabold text-espresso">
            Nuevo pedido
          </span>
          <button
            onClick={onClose}
            className="bg-transparent border-none cursor-pointer text-muted flex items-center transition-colors hover:text-brown"
          >
            <span className="icon" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        {/* Body */}
        <form
          id="pedido-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="overflow-y-auto flex-1 flex flex-col gap-[18px] px-[26px] py-[22px]"
        >
          {/* Nombre */}
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="nombre" className="text-[12px] font-extrabold uppercase tracking-[0.1em]" style={{ color: '#7A4020' }}>
              Nombre del cliente
            </label>
            <input
              id="nombre"
              type="text"
              placeholder="Ej: Maria Garcia"
              {...form.register('nombre')}
              className="px-[14px] py-3 border-[1.5px] border-sand-deep rounded-[12px] font-sans text-sm text-espresso bg-cream outline-none focus:border-terra w-full"
            />
            {form.formState.errors.nombre && (
              <p className="text-xs text-red-600">{form.formState.errors.nombre.message}</p>
            )}
          </div>

          {/* Telefono + Direccion */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="telefono" className="text-[12px] font-extrabold uppercase tracking-[0.1em]" style={{ color: '#7A4020' }}>
                Telefono
              </label>
              <input
                id="telefono"
                type="tel"
                placeholder="Opcional"
                {...form.register('telefono')}
                className="px-[14px] py-3 border-[1.5px] border-sand-deep rounded-[12px] font-sans text-sm text-espresso bg-cream outline-none focus:border-terra w-full"
              />
            </div>
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="direccion" className="text-[12px] font-extrabold uppercase tracking-[0.1em]" style={{ color: '#7A4020' }}>
                Direccion
              </label>
              <input
                id="direccion"
                type="text"
                placeholder="Opcional"
                {...form.register('direccion')}
                className="px-[14px] py-3 border-[1.5px] border-sand-deep rounded-[12px] font-sans text-sm text-espresso bg-cream outline-none focus:border-terra w-full"
              />
            </div>
          </div>

          {/* Fecha entrega */}
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="fechaEntrega" className="text-[12px] font-extrabold uppercase tracking-[0.1em]" style={{ color: '#7A4020' }}>
              Fecha de entrega
            </label>
            <input
              id="fechaEntrega"
              type="date"
              min={todayStr}
              {...form.register('fechaEntrega')}
              className="px-[14px] py-3 border-[1.5px] rounded-[12px] font-sans text-sm text-espresso bg-cream outline-none focus:border-terra w-full"
              style={{ borderColor: dateWarning ? '#dc2626' : undefined }}
            />
            {dateWarning ? (
              <div className="flex items-center gap-[6px] text-[12.5px] font-semibold mt-0.5" style={{ color: '#dc2626' }}>
                <span className="icon" style={{ fontSize: 15 }}>error</span>
                {dateWarning}
              </div>
            ) : enabledHint ? (
              <div className="text-[12px] font-medium mt-0.5" style={{ color: '#9A7A66' }}>
                Entregas disponibles: <strong style={{ color: '#7A4020' }}>{enabledHint}</strong>
              </div>
            ) : null}
          </div>

          {/* Notas */}
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="notas" className="text-[12px] font-extrabold uppercase tracking-[0.1em]" style={{ color: '#7A4020' }}>
              Notas (opcional)
            </label>
            <textarea
              id="notas"
              placeholder="Observaciones del pedido..."
              rows={2}
              {...form.register('notas')}
              className="px-[14px] py-3 border-[1.5px] border-sand-deep rounded-[12px] font-sans text-sm text-espresso bg-cream outline-none focus:border-terra w-full resize-y"
              style={{ minHeight: 60 }}
            />
          </div>

          {/* Productos */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[12px] font-extrabold uppercase tracking-[0.1em]" style={{ color: '#7A4020' }}>
                Productos del pedido
              </span>
              <button
                type="button"
                onClick={() => append({ productoId: 0, cantidad: 1, precioUnitario: 0 })}
                className="inline-flex items-center gap-1 text-xs font-semibold text-terra border-[1.5px] border-terra-light rounded-[10px] px-2.5 py-1 bg-white cursor-pointer transition-colors hover:bg-terra-light"
              >
                <span className="icon" style={{ fontSize: 16 }}>add</span>
                Agregar
              </button>
            </div>

            <div
              className="flex flex-col gap-2 p-[14px] rounded-[12px] border-[1.5px] border-sand"
              style={{ background: '#FAF1E3' }}
            >
              {fields.map((field, index) => {
                const errs = form.formState.errors.items?.[index]
                return (
                  <div key={field.id} className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
                    <select
                      {...form.register(`items.${index}.productoId`)}
                      onChange={(e) => {
                        form.setValue(`items.${index}.productoId`, Number(e.target.value))
                        handleProductoChange(index, Number(e.target.value))
                      }}
                      className="flex-1 min-w-0 px-3 py-[9px] border-[1.5px] border-sand-deep rounded-[10px] font-sans text-[13px] text-espresso bg-white outline-none focus:border-terra"
                    >
                      <option value={0}>Seleccionar producto</option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      title="Cantidad"
                      {...form.register(`items.${index}.cantidad`)}
                      className="w-[60px] px-2 py-[9px] border-[1.5px] border-sand-deep rounded-[10px] font-sans text-[13px] text-espresso bg-white outline-none focus:border-terra text-center shrink-0"
                    />
                    <input
                      type="number"
                      min="0"
                      title="Precio unitario"
                      {...form.register(`items.${index}.precioUnitario`)}
                      className="w-[90px] px-2 py-[9px] border-[1.5px] border-sand-deep rounded-[10px] font-sans text-[13px] text-espresso bg-white outline-none focus:border-terra text-right shrink-0"
                    />
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="size-8 flex items-center justify-center rounded-lg border-[1.5px] border-red-200 bg-transparent cursor-pointer text-red-600 hover:bg-red-50 shrink-0"
                      >
                        <span className="icon" style={{ fontSize: 16 }}>close</span>
                      </button>
                    )}
                    {(errs?.productoId || errs?.cantidad || errs?.precioUnitario) && (
                      <p className="text-xs text-red-600 w-full">
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

          {/* Total */}
          <div
            className="flex justify-between items-baseline px-4 py-3 rounded-[12px]"
            style={{ background: '#2C1208', color: 'white' }}
          >
            <span className="text-[13px] font-bold uppercase tracking-[0.1em]">Total del pedido</span>
            <span className="font-display text-[26px] font-extrabold">{fmt(total)}</span>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-2.5 px-[26px] py-[18px] border-t border-sand shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-[10px] border-[1.5px] border-sand-deep bg-transparent font-sans text-sm font-semibold cursor-pointer transition-colors hover:bg-sand"
            style={{ color: '#7A4020' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="pedido-form"
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] border-none font-sans text-sm font-bold text-white cursor-pointer shadow-[0_3px_12px_rgba(196,82,42,0.3)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: loading ? '#E2CFB5' : '#C4522A' }}
          >
            <span className="icon icon-fill" style={{ fontSize: 18 }}>save</span>
            Crear pedido
          </button>
        </div>
      </div>
    </div>
  )
}

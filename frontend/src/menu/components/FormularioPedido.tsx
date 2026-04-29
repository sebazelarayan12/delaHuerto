import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ItemCarrito } from '../hooks/useCarrito'
import { enviarPedidoWhatsApp } from '../helpers/whatsapp.helper'
import { getFechasDisponibles, formatFechaLarga, formatFechaCorta } from '../helpers/fechaEntrega.helper'
import SelectorFechaEntrega from './SelectorFechaEntrega'

const FECHAS_DISPONIBLES = getFechasDisponibles()

const schema = z.object({
  nombre: z.string().min(2, 'El nombre es muy corto').max(50, 'El nombre es muy largo').regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo se permiten letras'),
  telefono: z.string().refine(val => val.replace(/\D/g, '').length >= 10, 'Debe tener al menos 10 números (ej: 11 1234 5678)'),
  direccion: z.string().min(6, 'Ingresá calle y altura (ej: San Martín 123)'),
  metodoPago: z.enum(['efectivo', 'transferencia']),
  notas: z.string().optional(),
  fechaEntrega: z.string().min(1, 'Selecciona una fecha de entrega'),
})

type FormData = z.infer<typeof schema>

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

const PEDIDOS_KEY = 'empanadas_pedidos_enviados'

function getPedidosEnviados(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(PEDIDOS_KEY) ?? '[]')
  } catch {
    return []
  }
}

function registrarPedido(telefono: string) {
  const prev = getPedidosEnviados()
  sessionStorage.setItem(PEDIDOS_KEY, JSON.stringify([...prev, telefono]))
}

interface Props {
  open: boolean
  onClose: () => void
  items: ItemCarrito[]
  total: number
  subtotal: number
  montoDescuento: number
  onSuccess: () => void
}

export default function FormularioPedido({ open, onClose, onSuccess, items, total, subtotal, montoDescuento }: Props) {
  const [sent, setSent] = useState(false)
  const [dupError, setDupError] = useState(false)
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors }, control } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { metodoPago: 'efectivo' },
  })

  const metodoPago = useWatch({ control, name: 'metodoPago' })

  const onSubmit = (data: FormData) => {
    const enviados = getPedidosEnviados()
    if (enviados.includes(data.telefono)) {
      setDupError(true)
      return
    }
    setDupError(false)
    enviarPedidoWhatsApp(items, data)
    registrarPedido(data.telefono)
    setSent(true)
    onSuccess()
  }

  function handleSelectFecha(date: Date): void {
    setFechaSeleccionada(date)
    setValue('fechaEntrega', formatFechaLarga(date), { shouldValidate: true })
    setCalendarOpen(false)
  }

  const handleClose = () => {
    setSent(false)
    setDupError(false)
    setFechaSeleccionada(null)
    setCalendarOpen(false)
    onClose()
  }

  return (
    <div
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
      onKeyDown={(e) => { if (e.key === 'Escape') handleClose() }}
      className={`fixed inset-0 bg-[#2C1208]/60 z-50 flex items-end justify-center max-w-[430px] mx-auto transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
    >
      <div
        className={`w-full bg-ivory rounded-t-[24px] max-h-[calc(100dvh-40px)] flex flex-col transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full bg-sand-deep" />
        </div>

        {!sent ? (
          <>
            <div className="px-5 pt-2 pb-4 flex justify-between items-start border-b border-sand-deep shrink-0">
              <div>
                <h2 className="font-display text-lg font-extrabold text-espresso">
                  Datos del pedido
                </h2>
                <p className="text-[13px] text-muted mt-0.5">
                  Completá tus datos para WhatsApp
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Cerrar formulario"
                className="bg-sand border-none rounded-full w-11 h-11 flex items-center justify-center cursor-pointer text-brown shrink-0"
              >
                <span className="icon text-[20px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pt-5 pb-8">
              <div className="bg-sand rounded-[14px] px-3.5 py-3 mb-5">
              {items.map((item) => (
                <div key={item.productoId} className="flex justify-between text-[13px] color-brown mb-1">
                  <span className="font-semibold">{item.nombre} × {item.cantidad}</span>
                  <span>{fmt(item.precio * item.cantidad)}</span>
                </div>
              ))}
              {montoDescuento > 0 && (
                <>
                  <div className="flex justify-between pt-2 border-t border-sand-deep mt-1">
                    <span className="text-muted text-[13px]">Subtotal</span>
                    <span className="text-muted text-[13px]">{fmt(subtotal)}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-green-700 text-[13px] font-semibold">Descuento</span>
                    <span className="text-green-700 text-[13px] font-semibold">-{fmt(montoDescuento)}</span>
                  </div>
                </>
              )}
              <div className={`flex justify-between pt-2 mt-1 ${montoDescuento > 0 ? '' : 'border-t border-sand-deep'}`}>
                <span className="font-extrabold text-espresso text-sm">Total</span>
                <span className="font-extrabold text-terra text-sm">{fmt(total)}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <Field label="Nombre y apellido" error={errors.nombre?.message}>
                <input type="text" placeholder="María González" {...register('nombre')} className="w-full px-3.5 py-3 border-[1.5px] border-sand-deep rounded-xl font-sans text-[15px] text-espresso bg-cream outline-none focus:border-terra" />
              </Field>
              <Field label="Teléfono" error={errors.telefono?.message}>
                <>
                  <input type="tel" placeholder="11 1234-5678" {...register('telefono')} className="w-full px-3.5 py-3 border-[1.5px] border-sand-deep rounded-xl font-sans text-[15px] text-espresso bg-cream outline-none focus:border-terra" onChange={() => setDupError(false)} />
                  {dupError && (
                    <span className="text-xs text-red-600 mt-1 block">
                      Ya enviaste un pedido con este número en esta sesión.
                    </span>
                  )}
                </>
              </Field>
              <Field label="Dirección de entrega" error={errors.direccion?.message}>
                <input type="text" placeholder="Av. Corrientes 1234, CABA" {...register('direccion')} className="w-full px-3.5 py-3 border-[1.5px] border-sand-deep rounded-xl font-sans text-[15px] text-espresso bg-cream outline-none focus:border-terra" />
              </Field>
              <Field label="Fecha de entrega" error={errors.fechaEntrega?.message}>
                <div style={{ position: 'relative' }}>
                  {FECHAS_DISPONIBLES.length === 0 ? (
                    <p className="text-[13px] px-1" style={{ color: '#C4522A' }}>
                      No hay fechas de entrega disponibles por el momento.
                    </p>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setCalendarOpen(prev => !prev)}
                        className="w-full px-3.5 py-3 border-[1.5px] border-sand-deep rounded-xl font-sans text-[15px] bg-cream outline-none text-left flex items-center gap-2"
                        style={{ color: fechaSeleccionada ? '#2C1208' : '#9E8C7E' }}
                      >
                        <span className="icon text-[20px]">calendar_month</span>
                        {fechaSeleccionada ? formatFechaCorta(fechaSeleccionada) : 'Selecciona una fecha'}
                      </button>
                      {calendarOpen && (
                        <SelectorFechaEntrega
                          fechasDisponibles={FECHAS_DISPONIBLES}
                          selected={fechaSeleccionada}
                          onSelect={handleSelectFecha}
                          onClose={() => setCalendarOpen(false)}
                        />
                      )}
                    </>
                  )}
                  <input type="hidden" {...register('fechaEntrega')} />
                </div>
              </Field>
              <Field label="Método de pago" error={errors.metodoPago?.message}>
                <div className="flex gap-2.5">
                  <RadioPill id="ef" value="efectivo" label="Efectivo" icon="payments" register={register} name="metodoPago" checked={metodoPago === 'efectivo'} />
                  <RadioPill id="tr" value="transferencia" label="Transferencia" icon="account_balance" register={register} name="metodoPago" checked={metodoPago === 'transferencia'} />
                </div>
              </Field>
              <Field label="Notas (opcional)">
                <textarea placeholder="Sin aceitunas, picante, horario de entrega…" {...register('notas')} className="w-full px-3.5 py-3 border-[1.5px] border-sand-deep rounded-xl font-sans text-[15px] text-espresso bg-cream outline-none focus:border-terra resize-none h-[72px]" />
              </Field>

              <button
                type="submit"
                className="w-full p-4 bg-[#25D366] border-none rounded-[14px] text-white font-sans text-base font-bold cursor-pointer flex items-center justify-center gap-2.5 shadow-[0_4px_16px_rgba(37,211,102,0.4)] mb-2 transition-transform duration-200 hover:scale-[1.02]"
              >
                <WhatsAppIcon />
                Enviar pedido por WhatsApp
              </button>
            </form>
          </div>
          </>
        ) : (
          <div className="px-7 pt-10 pb-8 text-center flex-1 overflow-y-auto">
            <span className="icon icon-fill text-[64px] text-terra block mb-4">celebration</span>
            <h2 className="font-display text-2xl font-extrabold text-espresso mb-2">
              ¡Pedido enviado!
            </h2>
            <p className="text-muted leading-relaxed mb-7">
              Te abrimos WhatsApp para que confirmemos los detalles. En breve nos ponemos en contacto.
            </p>
            <button
              onClick={handleClose}
              className="w-full p-4 bg-terra border-none rounded-[14px] text-white font-sans text-base font-bold cursor-pointer shadow-[0_4px_16px_rgba(196,82,42,0.4)] transition-colors duration-200 hover:bg-terra-dark"
            >
              Volver al menú
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-brown mb-1.5 uppercase tracking-[0.08em]">
        {label}
      </label>
      {children}
      {error && <span className="text-xs text-red-600 mt-1 block">{error}</span>}
    </div>
  )
}

function RadioPill({ id, value, label, icon, register, name, checked }: {
  id: string
  value: string
  label: string
  icon: string
  register: ReturnType<typeof useForm<FormData>>['register']
  name: keyof FormData
  checked: boolean
}) {
  return (
    <div className="flex-1 relative">
      <input
        type="radio"
        id={`p-${id}`}
        value={value}
        {...register(name)}
        className="absolute opacity-0 w-0 h-0"
      />
      <label
        htmlFor={`p-${id}`}
        className={`flex items-center justify-center gap-1.5 py-2.5 px-2 border-[1.5px] rounded-xl cursor-pointer text-sm font-semibold transition-all duration-150 ${checked ? 'border-terra text-terra bg-[#FDF0EB] ring-1 ring-terra' : 'border-sand-deep text-muted bg-cream hover:bg-sand'}`}
      >
        <span className="icon text-[18px]">{icon}</span>
        {label}
      </label>
    </div>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.374 0 0 5.373 0 12c0 2.121.554 4.11 1.522 5.835L.054 23.454a.75.75 0 0 0 .492.942.749.749 0 0 0 .452-.009l5.828-1.861A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.699 9.699 0 0 1-4.95-1.355l-.355-.212-3.682 1.178 1.098-3.574-.231-.369A9.718 9.718 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
    </svg>
  )
}

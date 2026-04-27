import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ItemCarrito } from '../hooks/useCarrito'
import { enviarPedidoWhatsApp } from '../helpers/whatsapp.helper'

const schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  telefono: z.string().min(8, 'Mínimo 8 caracteres'),
  direccion: z.string().min(5, 'Mínimo 5 caracteres'),
  metodoPago: z.enum(['efectivo', 'transferencia']),
  notas: z.string().optional(),
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
  porcentajeDescuento: number
}

export default function FormularioPedido({ open, onClose, items, total, subtotal, montoDescuento, porcentajeDescuento }: Props) {
  const [sent, setSent] = useState(false)
  const [dupError, setDupError] = useState(false)

  const { register, handleSubmit, formState: { errors }, control } = useForm<FormData>({
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
  }

  const handleClose = () => {
    setSent(false)
    setDupError(false)
    onClose()
  }

  return (
    <div
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
      onKeyDown={(e) => { if (e.key === 'Escape') handleClose() }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(44,18,8,0.6)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'all' : 'none',
        transition: 'opacity 0.3s ease',
        maxWidth: 430,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          width: '100%',
          background: '#FFFDF9',
          borderRadius: '24px 24px 0 0',
          paddingBottom: 32,
          maxHeight: '92vh',
          overflowY: 'auto',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: '#E2CFB5' }} />
        </div>

        {!sent ? (
          <div style={{ padding: '16px 20px 0' }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 800, color: '#2C1208' }}>
                Datos del pedido
              </h2>
              <p style={{ fontSize: 13, color: '#9A7A66', marginTop: 4 }}>
                Completá tus datos y te contactamos por WhatsApp
              </p>
            </div>

            <div style={{ background: '#F3E8D8', borderRadius: 14, padding: '12px 14px', marginBottom: 20 }}>
              {items.map((item) => (
                <div key={item.productoId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#7A4020', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{item.nombre} × {item.cantidad}</span>
                  <span>{fmt(item.precio * item.cantidad)}</span>
                </div>
              ))}
              {montoDescuento > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #E2CFB5', marginTop: 4 }}>
                    <span style={{ color: '#9A7A66', fontSize: 13 }}>Subtotal</span>
                    <span style={{ color: '#9A7A66', fontSize: 13 }}>{fmt(subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ color: '#15803d', fontSize: 13, fontWeight: 600 }}>Descuento ({porcentajeDescuento * 100}%)</span>
                    <span style={{ color: '#15803d', fontSize: 13, fontWeight: 600 }}>-{fmt(montoDescuento)}</span>
                  </div>
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: montoDescuento > 0 ? 'none' : '1px solid #E2CFB5', marginTop: 4 }}>
                <span style={{ fontWeight: 800, color: '#2C1208', fontSize: 14 }}>Total</span>
                <span style={{ fontWeight: 800, color: '#C4522A', fontSize: 14 }}>{fmt(total)}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <Field label="Nombre y apellido" error={errors.nombre?.message}>
                <input type="text" placeholder="María González" {...register('nombre')} style={inputStyle} />
              </Field>
              <Field label="Teléfono" error={errors.telefono?.message}>
                <>
                  <input type="tel" placeholder="11 1234-5678" {...register('telefono')} style={inputStyle} onChange={() => setDupError(false)} />
                  {dupError && (
                    <span style={{ fontSize: 12, color: '#dc2626', marginTop: 4, display: 'block' }}>
                      Ya enviaste un pedido con este número en esta sesión.
                    </span>
                  )}
                </>
              </Field>
              <Field label="Dirección de entrega" error={errors.direccion?.message}>
                <input type="text" placeholder="Av. Corrientes 1234, CABA" {...register('direccion')} style={inputStyle} />
              </Field>
              <Field label="Método de pago" error={errors.metodoPago?.message}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <RadioPill id="ef" value="efectivo" label="Efectivo" icon="payments" register={register} name="metodoPago" checked={metodoPago === 'efectivo'} />
                  <RadioPill id="tr" value="transferencia" label="Transferencia" icon="account_balance" register={register} name="metodoPago" checked={metodoPago === 'transferencia'} />
                </div>
              </Field>
              <Field label="Notas (opcional)">
                <textarea placeholder="Sin aceitunas, picante, horario de entrega…" {...register('notas')} style={{ ...inputStyle, resize: 'none', height: 72 }} />
              </Field>

              <button
                type="submit"
                style={{ width: '100%', padding: 16, background: '#25D366', border: 'none', borderRadius: 14, color: 'white', fontFamily: "'Manrope', sans-serif", fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 16px rgba(37,211,102,0.4)', marginBottom: 8 }}
              >
                <WhatsAppIcon />
                Enviar pedido por WhatsApp
              </button>
            </form>
          </div>
        ) : (
          <div style={{ padding: '40px 28px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 800, color: '#2C1208', marginBottom: 8 }}>
              ¡Pedido enviado!
            </h2>
            <p style={{ color: '#9A7A66', lineHeight: 1.6, marginBottom: 28 }}>
              Te abrimos WhatsApp para que confirmemos los detalles. En breve nos ponemos en contacto.
            </p>
            <button
              onClick={handleClose}
              style={{ width: '100%', padding: 16, background: '#C4522A', border: 'none', borderRadius: 14, color: 'white', fontFamily: "'Manrope', sans-serif", fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
            >
              Volver al menú
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  border: '1.5px solid #E8D5BC',
  borderRadius: 12,
  fontFamily: "'Manrope', sans-serif",
  fontSize: 15,
  color: '#2C1208',
  background: '#FDF6EC',
  outline: 'none',
  WebkitAppearance: 'none',
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#7A4020', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </label>
      {children}
      {error && <span style={{ fontSize: 12, color: '#dc2626', marginTop: 4, display: 'block' }}>{error}</span>}
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
    <div style={{ flex: 1, position: 'relative' }}>
      <input
        type="radio"
        id={`p-${id}`}
        value={value}
        {...register(name)}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
      />
      <label
        htmlFor={`p-${id}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '11px 8px',
          border: checked ? '2px solid #C4522A' : '1.5px solid #E8D5BC',
          borderRadius: 12,
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 600,
          color: checked ? '#C4522A' : '#9A7A66',
          background: checked ? '#FDF0EB' : '#FDF6EC',
          transition: 'background 0.15s, border-color 0.15s, color 0.15s',
        }}
      >
        <span className="icon" style={{ fontSize: 18 }}>{icon}</span>
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

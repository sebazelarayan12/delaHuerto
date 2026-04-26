import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { CategoriaAdmin } from './hooks/useCategorias'

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
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', orden: 0, activa: true },
  })

  const activa = watch('activa')

  useEffect(() => {
    if (open) {
      reset(initial ? { nombre: initial.nombre, orden: initial.orden, activa: initial.activa } : { nombre: '', orden: 0, activa: true })
    }
  }, [open, initial, reset])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(44,18,8,0.5)',
        zIndex: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: "'Manrope', sans-serif",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 18,
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 20px 60px rgba(44,18,8,0.2)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #F3E8D8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#2C1208' }}>
            {initial ? 'Editar categoría' : 'Nueva categoría'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A7A66', display: 'flex', alignItems: 'center' }}
          >
            <span className="icon">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSave)} style={{ padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Nombre de la categoría</label>
            <input type="text" placeholder="Ej: Empanadas Fritas" {...register('nombre')} style={inputStyle} />
            {errors.nombre && <span style={errStyle}>{errors.nombre.message}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Orden</label>
              <input type="number" min="0" {...register('orden')} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Estado</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={activa}
                    onChange={(e) => setValue('activa', e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 99,
                      background: activa ? '#C4522A' : '#E2CFB5',
                      transition: 'background 0.2s',
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: 3,
                      left: activa ? 22 : 3,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: 'white',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                      transition: 'left 0.2s',
                    }}
                  />
                </label>
                <span style={{ fontSize: 13, fontWeight: 600, color: activa ? '#15803d' : '#9A7A66' }}>
                  {activa ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid #F3E8D8' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                borderRadius: 10,
                border: '1.5px solid #E2CFB5',
                background: 'transparent',
                fontFamily: "'Manrope', sans-serif",
                fontSize: 14,
                fontWeight: 600,
                color: '#7A4020',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '9px 16px',
                borderRadius: 10,
                border: 'none',
                background: loading ? '#E2CFB5' : '#C4522A',
                color: 'white',
                fontFamily: "'Manrope', sans-serif",
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(196,82,42,0.3)',
              }}
            >
              <span className="icon icon-fill" style={{ fontSize: 17 }}>save</span>
              {initial ? 'Guardar cambios' : 'Crear categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#7A4020',
  marginBottom: 5,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 13px',
  border: '1.5px solid #E2CFB5',
  borderRadius: 10,
  fontFamily: "'Manrope', sans-serif",
  fontSize: 14,
  color: '#2C1208',
  background: '#FDF6EC',
  outline: 'none',
}

const errStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#dc2626',
  marginTop: 4,
  display: 'block',
}

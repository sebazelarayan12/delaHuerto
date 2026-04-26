import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { CategoriaAdmin } from '../categorias/hooks/useCategorias'
import type { ProductoAdmin } from './hooks/useProductos'
import ImageUpload from '../../shared/components/ImageUpload'

const schema = z.object({
  categoriaId: z.coerce.number().min(1, 'Seleccioná una categoría'),
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  precio: z.coerce.number().positive('El precio debe ser mayor a 0'),
  precioUnidad: z.coerce.number().positive().optional().or(z.literal('')),
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
}

export default function ProductoForm({ open, onClose, onSave, initial, categorias, loading }: Props) {
  const [foto, setFoto] = useState<File | null>(null)
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', orden: 0, disponible: true },
  })

  const disponible = watch('disponible')

  useEffect(() => {
    if (open) {
      setFoto(null)
      reset(
        initial
          ? {
              categoriaId: initial.categoriaId,
              nombre: initial.nombre,
              descripcion: initial.descripcion ?? '',
              precio: parseFloat(initial.precio),
              precioUnidad: initial.precioUnidad ? parseFloat(initial.precioUnidad) : undefined,
              disponible: initial.disponible,
              orden: initial.orden,
            }
          : { nombre: '', orden: 0, disponible: true, descripcion: '', precio: undefined }
      )
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
          maxWidth: 600,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(44,18,8,0.2)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
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
            {initial ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A7A66', display: 'flex', alignItems: 'center' }}>
            <span className="icon">close</span>
          </button>
        </div>

        <form
          onSubmit={handleSubmit((data) => onSave(data, foto))}
          style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}
        >
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Categoría</label>
            <select {...register('categoriaId')} style={inputStyle}>
              <option value="">Seleccioná una categoría</option>
              {categorias.filter((c) => c.activa).map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            {errors.categoriaId && <span style={errStyle}>{errors.categoriaId.message}</span>}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Nombre</label>
            <input type="text" placeholder="Carne cortada a cuchillo" {...register('nombre')} style={inputStyle} />
            {errors.nombre && <span style={errStyle}>{errors.nombre.message}</span>}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Descripción (opcional)</label>
            <textarea
              placeholder="Descripción del producto…"
              {...register('descripcion')}
              style={{ ...inputStyle, resize: 'none', height: 72 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Precio por docena</label>
              <input type="number" step="0.01" placeholder="5500" {...register('precio')} style={inputStyle} />
              {errors.precio && <span style={errStyle}>{errors.precio.message}</span>}
            </div>
            <div>
              <label style={labelStyle}>Precio por unidad (opcional)</label>
              <input type="number" step="0.01" placeholder="500" {...register('precioUnidad')} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Orden</label>
              <input type="number" min="0" {...register('orden')} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Disponible</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={disponible}
                    onChange={(e) => setValue('disponible', e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{ position: 'absolute', inset: 0, borderRadius: 99, background: disponible ? '#C4522A' : '#E2CFB5', transition: 'background 0.2s' }} />
                  <span style={{ position: 'absolute', top: 3, left: disponible ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
                </label>
                <span style={{ fontSize: 13, fontWeight: 600, color: disponible ? '#15803d' : '#9A7A66' }}>
                  {disponible ? 'Disponible' : 'No disponible'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Foto del producto</label>
            <ImageUpload currentUrl={initial?.fotoUrl} onFileChange={setFoto} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid #F3E8D8' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '9px 16px', borderRadius: 10, border: '1.5px solid #E2CFB5', background: 'transparent', fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 600, color: '#7A4020', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: loading ? '#E2CFB5' : '#C4522A', color: 'white', fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(196,82,42,0.3)' }}
            >
              <span className="icon icon-fill" style={{ fontSize: 17 }}>save</span>
              {initial ? 'Guardar cambios' : 'Crear producto'}
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

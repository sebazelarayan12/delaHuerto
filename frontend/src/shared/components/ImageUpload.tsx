import { useRef, useState } from 'react'

interface Props {
  currentUrl?: string | null
  onFileChange: (file: File | null) => void
}

export default function ImageUpload({ currentUrl, onFileChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (file) {
      setPreview(URL.createObjectURL(file))
      onFileChange(file)
    } else {
      setPreview(null)
      onFileChange(null)
    }
  }

  const displayed = preview ?? currentUrl

  return (
    <div
      onClick={() => inputRef.current?.click()}
      style={{
        border: '2px dashed #E2CFB5',
        borderRadius: 12,
        padding: 16,
        cursor: 'pointer',
        textAlign: 'center',
        background: '#FDF6EC',
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = '#C4522A')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = '#E2CFB5')}
    >
      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} style={{ display: 'none' }} />
      {displayed ? (
        <div>
          <img
            src={displayed}
            alt="Preview"
            style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
          />
          <span style={{ fontSize: 12, color: '#9A7A66' }}>Clic para cambiar imagen</span>
        </div>
      ) : (
        <div>
          <span className="icon" style={{ fontSize: 36, color: '#C4522A', display: 'block', marginBottom: 6 }}>
            add_photo_alternate
          </span>
          <span style={{ fontSize: 13, color: '#9A7A66', fontWeight: 600 }}>Subir foto del producto</span>
        </div>
      )}
    </div>
  )
}

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
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="border-2 border-dashed border-sand-deep rounded-xl p-4 cursor-pointer text-center bg-cream transition-colors duration-200 w-full hover:border-terra"
    >
      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
      {displayed ? (
        <div>
          <img
            src={displayed}
            alt="Preview"
            className="w-full max-h-[160px] object-cover rounded-lg mb-2"
          />
          <span className="text-xs text-muted">Clic para cambiar imagen</span>
        </div>
      ) : (
        <div>
          <span className="icon text-[36px] text-terra block mb-1.5">
            add_photo_alternate
          </span>
          <span className="text-[13px] text-muted font-semibold">Subir foto del producto</span>
        </div>
      )}
    </button>
  )
}

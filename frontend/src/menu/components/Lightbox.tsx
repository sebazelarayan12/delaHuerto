import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  src: string
  alt: string
  onClose: () => void
}

export default function Lightbox({ src, alt, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-espresso/90 backdrop-blur-sm p-4"
    >
      <button
        onClick={onClose}
        aria-label="Cerrar imagen"
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 border-none text-white flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors"
      >
        <span className="icon text-[22px]">close</span>
      </button>
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-[90dvh] rounded-2xl object-contain shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
      />
    </div>,
    document.body
  )
}

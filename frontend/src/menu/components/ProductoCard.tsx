import { useState, useRef, useEffect } from 'react'
import * as m from 'motion/react-m'
import type { Producto } from '../hooks/useMenu'
import Lightbox from './Lightbox'

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
}

const LONG_PRESS_MS = 450

interface QuickAddButtonProps {
  compact: boolean
  openOnTap: boolean
  ariaLabel: string
  onTap: () => void
  onPick: (cantidad: number) => void
}

function QuickAddButton({ compact, openOnTap, ariaLabel, onTap, onPick }: QuickAddButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pressTimer = useRef<number | null>(null)
  const longPressFired = useRef(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onOutside = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onOutside)
    return () => document.removeEventListener('pointerdown', onOutside)
  }, [menuOpen])

  const startPress = () => {
    if (openOnTap) return
    longPressFired.current = false
    pressTimer.current = window.setTimeout(() => {
      longPressFired.current = true
      setMenuOpen(true)
    }, LONG_PRESS_MS)
  }

  const cancelPress = () => {
    if (pressTimer.current !== null) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }

  const handleClick = () => {
    if (openOnTap) {
      setMenuOpen(true)
      return
    }
    if (longPressFired.current) {
      longPressFired.current = false
      return
    }
    onTap()
  }

  const pick = (cantidad: number) => {
    onPick(cantidad)
    setMenuOpen(false)
  }

  return (
    <div ref={wrapRef} className="relative">
      {menuOpen && (
        <div className="absolute bottom-full right-0 mb-1.5 min-w-[124px] bg-espresso rounded-xl p-1 shadow-[0_10px_28px_rgba(0,0,0,0.28)] flex flex-col gap-0.5 z-10">
          <button
            onClick={() => pick(12)}
            className="flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-lg text-[11.5px] font-bold text-gold-light border-none bg-transparent cursor-pointer transition-colors hover:bg-white/10"
          >
            <span>Docena</span>
            <span className="text-gold">+12</span>
          </button>
          <button
            onClick={() => pick(6)}
            className="flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-lg text-[11.5px] font-bold text-gold-light border-none bg-transparent cursor-pointer transition-colors hover:bg-white/10"
          >
            <span>Media doc.</span>
            <span className="text-gold">+6</span>
          </button>
          <button
            onClick={() => pick(1)}
            className="flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-lg text-[11.5px] font-bold text-gold-light border-none bg-transparent cursor-pointer transition-colors hover:bg-white/10"
          >
            <span>Unidad</span>
            <span className="text-gold">+1</span>
          </button>
          <div className="absolute -bottom-1 right-[11px] size-2 bg-espresso rotate-45" />
        </div>
      )}
      <button
        onClick={handleClick}
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onPointerCancel={cancelPress}
        onContextMenu={(e) => e.preventDefault()}
        aria-label={ariaLabel}
        className={
          compact
            ? 'size-8 border-none bg-transparent text-white flex items-center justify-center active:scale-90 transition-transform duration-100 cursor-pointer select-none touch-manipulation shrink-0'
            : 'size-8 rounded-full bg-terra text-white flex items-center justify-center shadow-[0_3px_10px_rgba(196,82,42,0.4)] shrink-0 transition-all duration-150 hover:bg-terra-dark active:scale-90 border-none cursor-pointer select-none touch-manipulation'
        }
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  )
}

interface Props {
  producto: Producto
  perfil: 'cocinada' | 'congelada'
  cantidad: number
  onAgregar: () => void
  onIncrementar: () => void
  onDecrementar: () => void
  onAgregarCantidad: (cantidad: number) => void
}

export default function ProductoCard({ producto, perfil, cantidad, onAgregar, onIncrementar, onDecrementar, onAgregarCantidad }: Props) {
  const precio = perfil === 'cocinada' && producto.precioCocinada !== null
    ? parseFloat(producto.precioCocinada)
    : parseFloat(producto.precioCongelada as unknown as string)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  return (
    <m.div
      variants={cardVariants}
      className="flex flex-col rounded-2xl bg-white shadow-[0_2px_10px_rgba(44,18,8,0.07)] transition-shadow duration-300 hover:shadow-[0_4px_18px_rgba(196,82,42,0.14)] overflow-hidden"
    >
      <div className="w-full h-[130px] shrink-0 bg-sand">
        {producto.fotoUrl ? (
          <button
            onClick={() => setLightboxOpen(true)}
            className="w-full h-full border-none p-0 bg-transparent cursor-zoom-in"
            aria-label={`Ver foto de ${producto.nombre}`}
          >
            <img
              src={producto.fotoUrl}
              alt={producto.nombre}
              loading="lazy"
              className="w-full h-full object-cover block transition-transform duration-300 hover:scale-110"
            />
          </button>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="icon text-[36px] text-muted">lunch_dining</span>
          </div>
        )}
      </div>

      {lightboxOpen && producto.fotoUrl && (
        <Lightbox src={producto.fotoUrl} alt={producto.nombre} onClose={() => setLightboxOpen(false)} />
      )}

      <div className="flex-1 min-w-0 flex flex-col gap-1 p-3">
        <div className="text-[14px] font-bold text-espresso leading-snug line-clamp-2">
          {producto.nombre}
        </div>
        {producto.descripcion && (
          <div className="text-[12px] text-brown leading-relaxed line-clamp-2">
            {producto.descripcion}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between pt-1.5 gap-1.5">
          <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-terra-light border border-terra/20 text-[11px] font-extrabold text-terra tabular-nums shrink-0">
            {fmt(precio)}
          </div>

          {!producto.disponible ? (
            <div className="bg-sand text-muted px-2 py-1 rounded-full text-[10px] font-bold shrink-0">
              Sin stock
            </div>
          ) : cantidad === 0 ? (
            <QuickAddButton
              compact={false}
              openOnTap={true}
              ariaLabel={`Agregar ${producto.nombre}`}
              onTap={onAgregar}
              onPick={onAgregarCantidad}
            />
          ) : (
            <div className="flex items-center bg-terra rounded-full overflow-hidden h-8 shadow-[0_2px_8px_rgba(196,82,42,0.35)] shrink-0">
              <button
                onClick={onDecrementar}
                aria-label="Reducir cantidad"
                className="size-8 border-none bg-transparent text-white text-[15px] font-bold cursor-pointer flex items-center justify-center active:scale-90 transition-transform duration-100 shrink-0"
              >
                −
              </button>
              <span className="min-w-[18px] text-center text-white text-[12px] font-bold tabular-nums">
                {cantidad}
              </span>
              <QuickAddButton
                compact={true}
                openOnTap={false}
                ariaLabel="Aumentar cantidad"
                onTap={onIncrementar}
                onPick={onAgregarCantidad}
              />
            </div>
          )}
        </div>
      </div>
    </m.div>
  )
}

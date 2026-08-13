import { useState } from 'react'
import * as m from 'motion/react-m'
import type { Producto } from '../hooks/useMenu'
import Lightbox from './Lightbox'

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
}

interface Props {
  producto: Producto
  perfil: 'cocinada' | 'congelada'
  cantidad: number
  onAgregar: () => void
  onIncrementar: () => void
  onDecrementar: () => void
}

export default function ProductoCard({ producto, perfil, cantidad, onAgregar, onIncrementar, onDecrementar }: Props) {
  const precio = perfil === 'congelada' && producto.precioCongelada !== null
    ? parseFloat(producto.precioCongelada)
    : parseFloat(producto.precio as unknown as string)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  return (
    <m.div
      variants={cardVariants}
      className="flex gap-3 p-3.5 rounded-2xl bg-white shadow-[0_2px_10px_rgba(44,18,8,0.07)] transition-shadow duration-300 hover:shadow-[0_4px_18px_rgba(196,82,42,0.14)]"
    >
      <div className="w-[88px] h-[88px] md:w-[110px] md:h-[110px] shrink-0 rounded-2xl overflow-hidden bg-sand">
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

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="text-[15px] md:text-[16px] font-bold text-espresso leading-snug whitespace-nowrap overflow-hidden text-ellipsis md:whitespace-normal">
          {producto.nombre}
        </div>
        {producto.descripcion && (
          <div className="text-[13px] text-brown leading-relaxed line-clamp-2 md:line-clamp-3">
            {producto.descripcion}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between pt-1.5">
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-terra-light border border-terra/20 text-[13px] font-extrabold text-terra tabular-nums">
            {fmt(precio)}
          </div>

          {!producto.disponible ? (
            <div className="bg-sand text-muted px-3 py-1.5 rounded-full text-xs font-bold">
              Sin stock
            </div>
          ) : cantidad === 0 ? (
            <button
              onClick={onAgregar}
              aria-label={`Agregar ${producto.nombre}`}
              className="size-11 rounded-full bg-terra text-white flex items-center justify-center shadow-[0_3px_10px_rgba(196,82,42,0.4)] shrink-0 transition-all duration-150 hover:bg-terra-dark active:scale-90 border-none cursor-pointer"
            >
              <span className="icon text-[20px]">add</span>
            </button>
          ) : (
            <div className="flex items-center bg-terra rounded-full overflow-hidden h-11 shadow-[0_2px_8px_rgba(196,82,42,0.35)]">
              <button
                onClick={onDecrementar}
                aria-label="Reducir cantidad"
                className="size-11 border-none bg-transparent text-white text-[20px] font-bold cursor-pointer flex items-center justify-center active:scale-90 transition-transform duration-100"
              >
                −
              </button>
              <span className="min-w-[28px] text-center text-white text-[15px] font-bold tabular-nums">
                {cantidad}
              </span>
              <button
                onClick={onIncrementar}
                aria-label="Aumentar cantidad"
                className="size-11 border-none bg-transparent text-white text-[20px] font-bold cursor-pointer flex items-center justify-center active:scale-90 transition-transform duration-100"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </m.div>
  )
}

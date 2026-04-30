import { useState } from 'react'
import type { Producto } from '../hooks/useMenu'
import Lightbox from './Lightbox'

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

interface Props {
  producto: Producto
  cantidad: number
  onAgregar: () => void
  onIncrementar: () => void
  onDecrementar: () => void
}

export default function ProductoCard({ producto, cantidad, onAgregar, onIncrementar, onDecrementar }: Props) {
  const precio = parseFloat(producto.precio as unknown as string)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  return (
    <div className="flex gap-3 p-3.5 rounded-2xl bg-white shadow-[0_2px_10px_rgba(44,18,8,0.07)] transition-shadow duration-300 hover:shadow-[0_4px_18px_rgba(44,18,8,0.11)]">
      <div className="w-[88px] h-[88px] shrink-0 rounded-2xl overflow-hidden bg-sand">
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
        <div className="text-[15px] font-bold text-espresso leading-snug whitespace-nowrap overflow-hidden text-ellipsis">
          {producto.nombre}
        </div>
        {producto.descripcion && (
          <div className="text-[13px] text-muted leading-relaxed line-clamp-2">
            {producto.descripcion}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between pt-1.5">
          <div>
            <div className="text-[17px] font-extrabold text-terra tabular-nums">{fmt(precio)}</div>
          </div>

          {!producto.disponible ? (
            <div className="bg-sand text-muted px-3 py-1.5 rounded-full text-xs font-bold">
              Sin stock
            </div>
          ) : cantidad === 0 ? (
            <button
              onClick={onAgregar}
              aria-label={`Agregar ${producto.nombre}`}
              className="w-11 h-11 rounded-full bg-terra text-white flex items-center justify-center shadow-[0_3px_10px_rgba(196,82,42,0.4)] shrink-0 transition-all duration-150 hover:bg-terra-dark active:scale-90 border-none cursor-pointer"
            >
              <span className="icon text-[20px]">add</span>
            </button>
          ) : (
            <div className="flex items-center bg-terra rounded-full overflow-hidden h-11 shadow-[0_2px_8px_rgba(196,82,42,0.35)]">
              <button
                onClick={onDecrementar}
                aria-label="Reducir cantidad"
                className="w-11 h-11 border-none bg-transparent text-white text-[20px] font-bold cursor-pointer flex items-center justify-center active:scale-90 transition-transform duration-100"
              >
                −
              </button>
              <span className="min-w-[28px] text-center text-white text-[15px] font-bold tabular-nums">
                {cantidad}
              </span>
              <button
                onClick={onIncrementar}
                aria-label="Aumentar cantidad"
                className="w-11 h-11 border-none bg-transparent text-white text-[20px] font-bold cursor-pointer flex items-center justify-center active:scale-90 transition-transform duration-100"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

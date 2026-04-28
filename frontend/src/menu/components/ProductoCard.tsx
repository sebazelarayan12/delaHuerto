import type { Producto } from '../hooks/useMenu'

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

  return (
    <div className="flex gap-3 px-4 py-3.5 border-b border-sand bg-ivory">
      <div className="w-[88px] h-[88px] shrink-0 rounded-[14px] overflow-hidden bg-sand">
        {producto.fotoUrl ? (
          <img
            src={producto.fotoUrl}
            alt={producto.nombre}
            loading="lazy"
            className="w-full h-full object-cover block"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[32px]">
            🥟
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="text-[15px] font-bold text-espresso leading-snug whitespace-nowrap overflow-hidden text-ellipsis">
          {producto.nombre}
        </div>
        {producto.descripcion && (
          <div className="text-[12.5px] text-muted leading-relaxed line-clamp-2">
            {producto.descripcion}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between pt-1.5">
          <div>
            <div className="text-[17px] font-extrabold text-terra">{fmt(precio)}</div>
          </div>

          {!producto.disponible ? (
            <div className="bg-sand text-muted px-3 py-1.5 rounded-full text-xs font-bold">
              Sin stock
            </div>
          ) : cantidad === 0 ? (
            <button
              onClick={onAgregar}
              className="w-9 h-9 rounded-full bg-terra text-white text-[22px] flex items-center justify-center shadow-[0_3px_10px_rgba(196,82,42,0.4)] shrink-0 transition-colors duration-150 hover:bg-[#A0401E] border-none cursor-pointer"
            >
              <span className="icon text-[20px]">add</span>
            </button>
          ) : (
            <div className="flex items-center bg-terra rounded-full overflow-hidden h-9">
              <button
                onClick={onDecrementar}
                className="w-9 h-9 border-none bg-transparent text-white text-[20px] font-bold cursor-pointer flex items-center justify-center"
              >
                −
              </button>
              <span className="min-w-[28px] text-center text-white text-[15px] font-bold">
                {cantidad}
              </span>
              <button
                onClick={onIncrementar}
                className="w-9 h-9 border-none bg-transparent text-white text-[20px] font-bold cursor-pointer flex items-center justify-center"
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

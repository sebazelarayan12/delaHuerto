import LogoMark from '../../shared/components/LogoMark'
import type { Banner } from '../hooks/useBanner'

interface Props {
  cantidadTotal: number
  total: number
  activeCat: number | null
  categorias: { id: number; nombre: string }[]
  banner?: Banner | null
  onOpenCarrito: () => void
  onScrollToCategory: (id: number) => void
}

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

export default function MenuHeader({ cantidadTotal, total, activeCat, categorias, banner, onOpenCarrito, onScrollToCategory }: Props) {
  return (
    <header className="bg-gradient-to-br from-[#2C1208] to-[#5A2010] pt-5 px-4 sticky top-0 z-40">
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2.5">
          <LogoMark />
          <div>
            <div className="font-display text-[22px] font-extrabold text-gold-light leading-[1.1]">
              Huerto
            </div>
            <div className="text-[12px] font-semibold text-gold tracking-[0.18em] uppercase mt-0.5">
              Empanadas caseras
            </div>
          </div>
        </div>

        {cantidadTotal > 0 && (
          <button
            onClick={onOpenCarrito}
            className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-full py-2 pr-3.5 pl-2.5 cursor-pointer text-white font-sans transition-colors duration-200 hover:bg-white/20"
          >
            <span className="bg-terra rounded-full w-[22px] h-[22px] flex items-center justify-center text-xs font-extrabold">
              {cantidadTotal}
            </span>
            <span className="text-[13px] font-semibold">{fmt(total)}</span>
          </button>
        )}
      </div>

      {banner?.activo && (
        <div className="bg-gold -mx-4 px-4 pt-[7px] pb-2 text-espresso text-center">
          <div className="text-xs font-bold tracking-[0.02em] mb-1.5">{banner.titulo}</div>
          {banner.linea1 && <div className="text-xs font-bold">{banner.linea1}</div>}
          {banner.linea2 && <div className="text-xs font-bold">{banner.linea2}</div>}
        </div>
      )}

      <nav className="flex gap-2 overflow-x-auto py-3 no-scrollbar">
        {categorias.map((c) => (
          <button
            key={c.id}
            onClick={() => onScrollToCategory(c.id)}
            className={`shrink-0 px-4 py-[7px] rounded-full text-[13px] font-semibold cursor-pointer whitespace-nowrap border-[1.5px] transition-colors duration-200 ${activeCat === c.id ? 'bg-terra text-white border-terra' : 'bg-ivory text-brown border-sand-deep hover:bg-sand'}`}
          >
            {c.nombre}
          </button>
        ))}
      </nav>
    </header>
  )
}



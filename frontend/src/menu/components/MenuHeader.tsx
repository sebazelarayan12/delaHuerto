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
        <div className="-mx-4 px-4 py-2.5 flex items-start gap-3 bg-white/5 border-t border-b border-white/[0.07]">
          <div className="w-0.5 self-stretch bg-gold rounded-full shrink-0 min-h-[36px]" />
          <div className="flex flex-col gap-1">
            <div className="font-display italic text-[12.5px] text-gold-light leading-snug">{banner.titulo}</div>
            <div className="flex flex-col gap-px">
              {banner.linea1 && <div className="text-[11px] font-semibold text-gold/80">{banner.linea1}</div>}
              {banner.linea2 && <div className="text-[11px] font-semibold text-gold/80">{banner.linea2}</div>}
            </div>
          </div>
        </div>
      )}

      <nav className="-mx-4 flex gap-2 overflow-x-auto py-3 px-4 no-scrollbar">
        {categorias.map((c) => (
          <button
            key={c.id}
            onClick={() => onScrollToCategory(c.id)}
            className={`shrink-0 px-5 py-2 rounded-full text-[13px] font-semibold cursor-pointer whitespace-nowrap transition-all duration-200 ${activeCat === c.id ? 'bg-terra text-white shadow-[0_2px_10px_rgba(196,82,42,0.45)] scale-[1.04]' : 'bg-white/10 text-white/75 border border-white/10 hover:bg-white/20 hover:text-white'}`}
          >
            {c.nombre}
          </button>
        ))}
      </nav>
    </header>
  )
}



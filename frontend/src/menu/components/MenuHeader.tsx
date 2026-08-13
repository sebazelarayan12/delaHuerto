import * as m from 'motion/react-m'
import LogoMark from '../../shared/components/LogoMark'
import TypewriterText from './TypewriterText'
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
    <header className="relative bg-gradient-to-br from-espresso to-header-end pt-5 px-4 sticky top-0 z-40">
      <div className="grain-overlay absolute inset-0 opacity-[0.04]" />

      <div className="relative flex items-center justify-between pb-4">
        <div className="flex items-center gap-2.5">
          <LogoMark />
          <div>
            <div className="font-artisan text-[22px] font-extrabold text-gold-light leading-[1.1]">
              De la Huerto
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
            <span className="bg-terra rounded-full size-[22px] flex items-center justify-center text-xs font-extrabold">
              {cantidadTotal}
            </span>
            <span className="text-[13px] font-semibold">{fmt(total)}</span>
          </button>
        )}
      </div>

      {banner?.activo && (
        <div className="relative -mx-4 px-4 py-2.5 flex items-start gap-3 bg-white/5 border-t border-b border-white/[0.07]">
          <div className="w-0.5 self-stretch bg-gold rounded-full shrink-0 min-h-[36px]" />
          <div className="flex flex-col gap-1">
            <TypewriterText text={banner.titulo} className="font-display italic text-[12.5px] text-gold-light leading-snug" />
            <div className="flex flex-col gap-px">
              {banner.linea1 && <div className="text-[11px] font-semibold text-gold/80">{banner.linea1}</div>}
              {banner.linea2 && <div className="text-[11px] font-semibold text-gold/80">{banner.linea2}</div>}
            </div>
          </div>
        </div>
      )}

      <nav className="relative -mx-4 px-4 py-3">
        <div className="flex gap-1.5 overflow-x-auto md:flex-wrap md:overflow-x-visible md:justify-center bg-sand rounded-2xl p-1.5 no-scrollbar">
          {categorias.map((c) => (
            <button
              key={c.id}
              onClick={() => onScrollToCategory(c.id)}
              className={`relative shrink-0 flex-1 md:flex-none overflow-hidden px-4 py-2 rounded-xl text-[13px] font-semibold cursor-pointer whitespace-nowrap transition-colors duration-200 flex items-center justify-center gap-1.5 border ${
                activeCat === c.id ? 'border-transparent' : 'bg-white border-sand-deep text-brown hover:text-espresso'
              }`}
            >
              {activeCat === c.id && (
                <m.div
                  layoutId="activeNavPill"
                  className="absolute inset-0 rounded-xl bg-terra shadow-[0_2px_10px_rgba(107,122,79,0.45)]"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              {activeCat === c.id && (
                <span className="icon relative z-10 text-[15px] text-white">lunch_dining</span>
              )}
              <span className={`relative z-10 ${activeCat === c.id ? 'text-white' : ''}`}>
                {c.nombre}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </header>
  )
}

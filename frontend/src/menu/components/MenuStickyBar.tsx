import * as m from 'motion/react-m'

interface Props {
  activeCat: number | null
  categorias: { id: number; nombre: string }[]
  perfil: 'cocinada' | 'congelada'
  onPerfilChange: (perfil: 'cocinada' | 'congelada') => void
  onScrollToCategory: (id: number) => void
}

export default function MenuStickyBar({ activeCat, categorias, perfil, onPerfilChange, onScrollToCategory }: Props) {
  return (
    <div className="relative bg-header-end px-4 sticky top-0 z-40">
      <div className="grain-overlay absolute inset-0 opacity-[0.04]" />

      <div className="relative grid grid-cols-2 gap-2 pt-3.5 pb-3.5">
        <button
          type="button"
          onClick={() => onPerfilChange('cocinada')}
          className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold cursor-pointer transition-all duration-200 border ${
            perfil === 'cocinada' ? 'bg-cocinada text-white border-transparent shadow-[0_3px_12px_rgba(232,146,90,0.4)]' : 'bg-white/10 text-white/70 border-white/15 hover:bg-white/15'
          }`}
        >
          <span className="icon text-[18px]">local_fire_department</span>
          Cocinadas
        </button>
        <button
          type="button"
          onClick={() => onPerfilChange('congelada')}
          className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold cursor-pointer transition-all duration-200 border ${
            perfil === 'congelada' ? 'bg-congelada text-white border-transparent shadow-[0_3px_12px_rgba(111,175,214,0.4)]' : 'bg-white/10 text-white/70 border-white/15 hover:bg-white/15'
          }`}
        >
          <span className="icon text-[18px]">ac_unit</span>
          Congeladas
        </button>
      </div>

      <nav className="relative -mx-4 px-4 py-3">
        <div className="flex gap-1.5 overflow-x-auto md:flex-wrap md:overflow-x-visible md:justify-center bg-sand rounded-2xl p-1.5 no-scrollbar">
          {categorias.map((c) => (
            <button
              key={c.id}
              onClick={() => onScrollToCategory(c.id)}
              className={`relative shrink-0 overflow-hidden px-4 py-2 rounded-xl text-[13px] font-semibold cursor-pointer whitespace-nowrap transition-colors duration-200 flex items-center justify-center gap-1.5 border ${
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
              <span className={`relative z-10 ${activeCat === c.id ? 'text-white' : ''}`}>
                {c.nombre}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

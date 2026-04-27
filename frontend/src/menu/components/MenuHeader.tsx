interface Props {
  cantidadTotal: number
  total: number
  activeCat: number | null
  categorias: { id: number; nombre: string }[]
  onOpenCarrito: () => void
  onScrollToCategory: (id: number) => void
}

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

export default function MenuHeader({ cantidadTotal, total, activeCat, categorias, onOpenCarrito, onScrollToCategory }: Props) {
  return (
    <header
      style={{
        background: 'linear-gradient(135deg, #2C1208 0%, #5A2010 100%)',
        padding: '20px 16px 0',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LogoMark />
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 800, color: '#FBF1D8', lineHeight: 1.1 }}>
              Huerto
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#E8A838', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 1 }}>
              Empanadas caseras
            </div>
          </div>
        </div>

        {cantidadTotal > 0 && (
          <button
            onClick={onOpenCarrito}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 99, padding: '8px 14px 8px 10px', cursor: 'pointer', color: 'white', fontFamily: "'Manrope', sans-serif", transition: 'background 0.2s' }}
          >
            <span style={{ background: '#C4522A', borderRadius: 99, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>
              {cantidadTotal}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{fmt(total)}</span>
          </button>
        )}
      </div>

      <div style={{ background: '#E8A838', margin: '0 -16px', padding: '7px 16px', fontSize: 12, fontWeight: 700, color: '#2C1208', textAlign: 'center', letterSpacing: '0.02em' }}>
        🕐 Pedidos hasta las 19hs · Entrega el mismo día
      </div>

      <nav style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 0', scrollbarWidth: 'none' }}>
        {categorias.map((c) => (
          <button
            key={c.id}
            onClick={() => onScrollToCategory(c.id)}
            style={{ flexShrink: 0, padding: '7px 16px', borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', border: '1.5px solid', background: activeCat === c.id ? '#C4522A' : '#FFFDF9', color: activeCat === c.id ? 'white' : '#7A4020', borderColor: activeCat === c.id ? '#C4522A' : '#E2CFB5', transition: 'background 0.2s, color 0.2s' }}
          >
            {c.nombre}
          </button>
        ))}
      </nav>
    </header>
  )
}

function LogoMark() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="10" fill="#C4522A" />
      <path d="M8 22 Q12 10 18 14 Q24 18 28 10" stroke="#FBF1D8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <ellipse cx="18" cy="22" rx="8" ry="5" fill="#E8A838" opacity="0.9" />
      <path d="M10 22 Q14 28 18 27 Q22 28 26 22" stroke="#C4522A" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

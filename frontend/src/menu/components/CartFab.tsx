interface Props {
  cantidadTotal: number
  total: number
  onClick: () => void
}

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

export default function CartFab({ cantidadTotal, total, onClick }: Props) {
  if (cantidadTotal === 0) return null
  return (
    <button
      onClick={onClick}
      style={{ position: 'fixed', bottom: 24, right: 16, background: '#C4522A', border: 'none', borderRadius: 99, padding: '14px 20px 14px 16px', display: 'flex', alignItems: 'center', gap: 10, color: 'white', fontFamily: "'Manrope', sans-serif", fontSize: 15, fontWeight: 700, cursor: 'pointer', zIndex: 50, boxShadow: '0 6px 20px rgba(196,82,42,0.5)', transition: 'transform 0.2s, background 0.2s' }}
    >
      <span className="icon" style={{ fontSize: 22 }}>shopping_bag</span>
      <span>Ver carrito</span>
      <div style={{ background: '#D4920A', color: '#2C1208', borderRadius: 99, minWidth: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, padding: '0 6px' }}>
        {cantidadTotal}
      </div>
      <span style={{ marginLeft: 4, fontWeight: 600 }}>{fmt(total)}</span>
    </button>
  )
}

export interface BreakdownItem {
  productoId: number
  qty: number
  name: string
}

export interface AvisoAccent {
  bg: string
  border: string
  iconBg: string
  labelColor: string
  chipBg: string
  chipText: string
  chipBorder: string
}

interface AvisoCardProps {
  icon: string
  label: string
  total: number
  pedidosCount: number
  breakdown: BreakdownItem[]
  accent: AvisoAccent
}

export default function AvisoCard({ icon, label, total, pedidosCount, breakdown, accent }: AvisoCardProps) {
  return (
    <div
      aria-label={`${label}: ${total} ${total === 1 ? 'producto' : 'productos'}`}
      style={{
        background: accent.bg,
        border: `1.5px solid ${accent.border}`,
        borderRadius: 14,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: accent.iconBg, color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span className="icon icon-fill" style={{ fontSize: 22 }}>{icon}</span>
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 11, fontWeight: 800, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: accent.labelColor,
          }}>
            {label}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: 26, fontWeight: 800,
              color: 'var(--color-espresso)', lineHeight: 1.1,
            }}>
              {total}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-brown)' }}>
              {total === 1 ? 'producto' : 'productos'}
            </span>
            <span style={{ fontSize: 12.5, color: 'var(--color-muted)', fontWeight: 500 }}>
              · en {pedidosCount} {pedidosCount === 1 ? 'pedido' : 'pedidos'}
            </span>
          </div>
        </div>
      </div>

      {breakdown.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {breakdown.map((b) => (
            <span
              key={b.productoId}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: accent.chipBg,
                border: `1px solid ${accent.chipBorder}`,
                color: accent.chipText,
                padding: '5px 10px 5px 7px',
                borderRadius: 99,
                fontSize: 12.5, fontWeight: 600,
                maxWidth: '100%',
              }}
            >
              <span style={{
                background: 'white', color: accent.chipText,
                fontWeight: 800, fontSize: 11.5,
                padding: '1px 7px', borderRadius: 99,
                minWidth: 22, textAlign: 'center',
                border: `1px solid ${accent.chipBorder}`,
                flexShrink: 0,
              }}>
                {b.qty}
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {b.name}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

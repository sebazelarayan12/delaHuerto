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
  onClick?: () => void
  isActive?: boolean
}

export default function AvisoCard({ icon, label, total, pedidosCount, breakdown, accent, onClick, isActive }: AvisoCardProps) {
  const sharedClassName = `flex flex-col rounded-[14px] p-[14px_16px] transition-all${onClick ? ' cursor-pointer w-full text-left' : ''}`
  const sharedStyle = {
    background: accent.bg,
    border: isActive ? `2px solid ${accent.iconBg}` : `1.5px solid ${accent.border}`,
    gap: 12,
    boxShadow: isActive ? `0 4px 16px ${accent.iconBg}40` : undefined,
    transform: isActive ? 'translateY(-1px)' : undefined,
  }
  const ariaLabel = `${label}: ${total} ${total === 1 ? 'producto' : 'productos'}`

  const body = (
    <>
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center shrink-0 text-white rounded-[12px]"
          style={{ width: 42, height: 42, background: accent.iconBg }}
        >
          <span className="icon icon-fill" style={{ fontSize: 22 }}>{icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="uppercase tracking-widest"
            style={{ fontSize: 12, fontWeight: 800, color: accent.labelColor }}
          >
            {label}
          </div>
          <div className="flex items-baseline flex-wrap mt-0.5" style={{ gap: 8 }}>
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
        <div className="flex flex-wrap" style={{ gap: 6 }}>
          {breakdown.map((b) => (
            <span
              key={b.productoId}
              className="inline-flex items-center max-w-full rounded-full"
              style={{
                gap: 6,
                background: accent.chipBg,
                border: `1px solid ${accent.chipBorder}`,
                color: accent.chipText,
                padding: '5px 10px 5px 7px',
                fontSize: 12.5, fontWeight: 600,
              }}
            >
              <span
                className="bg-white shrink-0 text-center rounded-full"
                style={{
                  color: accent.chipText,
                  fontWeight: 800, fontSize: 12,
                  padding: '1px 7px',
                  minWidth: 22,
                  border: `1px solid ${accent.chipBorder}`,
                }}
              >
                {b.qty}
              </span>
              <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                {b.name}
              </span>
            </span>
          ))}
        </div>
      )}
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        aria-pressed={isActive}
        aria-label={ariaLabel}
        onClick={onClick}
        className={sharedClassName}
        style={{ appearance: 'none', ...sharedStyle }}
      >
        {body}
      </button>
    )
  }

  return (
    <div aria-label={ariaLabel} className={sharedClassName} style={sharedStyle}>
      {body}
    </div>
  )
}

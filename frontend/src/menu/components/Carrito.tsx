import type { ItemCarrito } from '../hooks/useCarrito'

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

interface Props {
  open: boolean
  onClose: () => void
  items: ItemCarrito[]
  total: number
  subtotal: number
  montoDescuento: number
  porcentajeDescuento: number
  cantidadTotal: number
  onIncrementar: (id: number) => void
  onDecrementar: (id: number) => void
  onConfirmar: () => void
}

export default function Carrito({ open, onClose, items, total, subtotal, montoDescuento, porcentajeDescuento, cantidadTotal, onIncrementar, onDecrementar, onConfirmar }: Props) {
  return (
    <div
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(44,18,8,0.55)',
        zIndex: 50,
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'all' : 'none',
        transition: 'opacity 0.3s ease',
        display: 'flex',
        justifyContent: 'flex-end',
        maxWidth: 430,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          width: '92%',
          maxWidth: 400,
          height: '100%',
          background: '#FFFDF9',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '20px 20px 16px',
            borderBottom: '1px solid #F3E8D8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#2C1208',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 20,
                fontWeight: 800,
                color: '#FBF1D8',
              }}
            >
              Tu pedido
            </div>
            <div style={{ fontSize: 12, color: '#E8A838', marginTop: 2, fontWeight: 600 }}>
              {cantidadTotal} docena{cantidadTotal !== 1 ? 's' : ''}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: 99,
              width: 36,
              height: 36,
              cursor: 'pointer',
              color: '#FBF1D8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span className="icon" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', color: '#9A7A66' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🫙</div>
              <div style={{ fontWeight: 600 }}>El carrito está vacío</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Agregá productos desde el menú</div>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.productoId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 20px',
                  borderBottom: '1px solid #F3E8D8',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#2C1208',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.nombre}
                  </div>
                  <div style={{ fontSize: 12, color: '#9A7A66', marginTop: 2 }}>
                    {fmt(item.precio)} c/u · Subtotal: {fmt(item.precio * item.cantidad)}
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#C4522A',
                    borderRadius: 99,
                    overflow: 'hidden',
                    height: 32,
                    transform: 'scale(0.9)',
                  }}
                >
                  <button
                    onClick={() => onDecrementar(item.productoId)}
                    style={{
                      width: 32,
                      height: 32,
                      border: 'none',
                      background: 'transparent',
                      color: 'white',
                      fontSize: 18,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    −
                  </button>
                  <span
                    style={{
                      minWidth: 22,
                      textAlign: 'center',
                      color: 'white',
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    {item.cantidad}
                  </span>
                  <button
                    onClick={() => onIncrementar(item.productoId)}
                    style={{
                      width: 32,
                      height: 32,
                      border: 'none',
                      background: 'transparent',
                      color: 'white',
                      fontSize: 18,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div
            style={{
              padding: '16px 20px 28px',
              borderTop: '2px solid #F3E8D8',
              background: '#FDF6EC',
            }}
          >
            {montoDescuento > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#9A7A66', marginBottom: 6 }}>
                  <span>Subtotal</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#15803d', fontWeight: 600, marginBottom: 12 }}>
                  <span>Descuento ({porcentajeDescuento * 100}%)</span>
                  <span>-{fmt(montoDescuento)}</span>
                </div>
              </>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: '#7A4020' }}>Total</span>
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 26,
                  fontWeight: 800,
                  color: '#C4522A',
                }}
              >
                {fmt(total)}
              </span>
            </div>
            <button
              onClick={onConfirmar}
              style={{
                width: '100%',
                padding: 16,
                background: '#C4522A',
                border: 'none',
                borderRadius: 14,
                color: 'white',
                fontFamily: "'Manrope', sans-serif",
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(196,82,42,0.4)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#A0401E' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#C4522A' }}
            >
              Confirmar pedido →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

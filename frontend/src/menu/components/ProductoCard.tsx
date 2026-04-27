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
  const precio = parseFloat(producto.precio)

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '14px 16px',
        borderBottom: '1px solid #F3E8D8',
        background: '#FFFDF9',
      }}
    >
      <div
        style={{
          width: 88,
          height: 88,
          flexShrink: 0,
          borderRadius: 14,
          overflow: 'hidden',
          background: '#F3E8D8',
        }}
      >
        {producto.fotoUrl ? (
          <img
            src={producto.fotoUrl}
            alt={producto.nombre}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
            }}
          >
            🥟
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: '#2C1208',
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {producto.nombre}
        </div>
        {producto.descripcion && (
          <div
            style={{
              fontSize: 12.5,
              color: '#9A7A66',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {producto.descripcion}
          </div>
        )}
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 6,
          }}
        >
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#C4522A' }}>{fmt(precio)}</div>
            <div style={{ fontSize: 10.5, color: '#9A7A66', fontWeight: 500 }}>la docena</div>
          </div>

          {!producto.disponible ? (
            <div style={{ background: '#F3E8D8', color: '#9A7A66', padding: '6px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
              Sin stock
            </div>
          ) : cantidad === 0 ? (
            <button
              onClick={onAgregar}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#C4522A',
                border: 'none',
                color: 'white',
                fontSize: 22,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(196,82,42,0.4)',
                flexShrink: 0,
                transition: 'transform 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#A0401E' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#C4522A' }}
            >
              <span className="icon" style={{ fontSize: 20 }}>add</span>
            </button>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#C4522A',
                borderRadius: 99,
                overflow: 'hidden',
                height: 36,
              }}
            >
              <button
                onClick={onDecrementar}
                style={{
                  width: 36,
                  height: 36,
                  border: 'none',
                  background: 'transparent',
                  color: 'white',
                  fontSize: 20,
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
                  minWidth: 28,
                  textAlign: 'center',
                  color: 'white',
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                {cantidad}
              </span>
              <button
                onClick={onIncrementar}
                style={{
                  width: 36,
                  height: 36,
                  border: 'none',
                  background: 'transparent',
                  color: 'white',
                  fontSize: 20,
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
          )}
        </div>
      </div>
    </div>
  )
}

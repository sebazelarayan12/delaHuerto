import { useState, useEffect } from 'react'
import { useMenu } from './hooks/useMenu'
import { useCarrito } from './hooks/useCarrito'
import CategoriaSection from './components/CategoriaSection'
import Carrito from './components/Carrito'
import FormularioPedido from './components/FormularioPedido'

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

export default function MenuPage() {
  const { data: categorias, isLoading, isError, refetch } = useMenu()
  const { items, agregar, incrementar, decrementar, total, cantidadTotal } = useCarrito()
  const [carritoOpen, setCarritoOpen] = useState(false)
  const [formularioOpen, setFormularioOpen] = useState(false)
  const [activeCat, setActiveCat] = useState<number | null>(null)

  useEffect(() => {
    if (categorias?.length && activeCat === null) {
      setActiveCat(categorias[0].id)
    }
  }, [categorias, activeCat])

  useEffect(() => {
    const onScroll = () => {
      if (!categorias) return
      const offset = 160
      for (let i = categorias.length - 1; i >= 0; i--) {
        const el = document.getElementById(`cat-${categorias[i].id}`)
        if (el && el.getBoundingClientRect().top <= offset) {
          setActiveCat(categorias[i].id)
          break
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [categorias])

  const scrollToCategory = (id: number) => {
    setActiveCat(id)
    const el = document.getElementById(`cat-${id}`)
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 145
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  const handleConfirmar = () => {
    setCarritoOpen(false)
    setTimeout(() => setFormularioOpen(true), 300)
  }

  const handleAgregar = (productoId: number) => {
    const cat = categorias?.flatMap((c) => c.productos).find((p) => p.id === productoId)
    if (cat) agregar(cat)
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 430,
        minHeight: '100vh',
        background: '#FDF6EC',
        position: 'relative',
        overflow: 'hidden',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <header
        style={{
          background: 'linear-gradient(135deg, #2C1208 0%, #5A2010 100%)',
          padding: '20px 16px 0',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LogoMark />
            <div>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#FBF1D8',
                  lineHeight: 1.1,
                }}
              >
                Huerto
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#E8A838',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  marginTop: 1,
                }}
              >
                Empanadas caseras
              </div>
            </div>
          </div>

          {cantidadTotal > 0 && (
            <button
              onClick={() => setCarritoOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 99,
                padding: '8px 14px 8px 10px',
                cursor: 'pointer',
                color: 'white',
                fontFamily: "'Manrope', sans-serif",
                transition: 'background 0.2s',
              }}
            >
              <span
                style={{
                  background: '#C4522A',
                  borderRadius: 99,
                  width: 22,
                  height: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {cantidadTotal}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{fmt(total)}</span>
            </button>
          )}
        </div>

        <div
          style={{
            background: '#E8A838',
            margin: '0 -16px',
            padding: '7px 16px',
            fontSize: 12,
            fontWeight: 700,
            color: '#2C1208',
            textAlign: 'center',
            letterSpacing: '0.02em',
          }}
        >
          🕐 Pedidos hasta las 19hs · Entrega el mismo día
        </div>
      </header>

      {/* Category nav */}
      {categorias && (
        <div
          style={{
            background: '#FDF6EC',
            borderBottom: '1px solid #E2CFB5',
            position: 'sticky',
            top: 97,
            zIndex: 30,
          }}
        >
          <nav
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              padding: '12px 16px',
              scrollbarWidth: 'none',
            }}
          >
            {categorias.map((c) => (
              <button
                key={c.id}
                onClick={() => scrollToCategory(c.id)}
                style={{
                  flexShrink: 0,
                  padding: '7px 16px',
                  borderRadius: 99,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  border: '1.5px solid',
                  background: activeCat === c.id ? '#C4522A' : '#FFFDF9',
                  color: activeCat === c.id ? 'white' : '#7A4020',
                  borderColor: activeCat === c.id ? '#C4522A' : '#E2CFB5',
                  transition: 'background 0.2s, color 0.2s',
                }}
              >
                {c.nombre}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Hero strip */}
      <div
        style={{
          background: 'linear-gradient(135deg, #3D1A0A 0%, #6B2D15 100%)',
          padding: '20px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 18,
              fontWeight: 800,
              color: '#FBF1D8',
              lineHeight: 1.3,
            }}
          >
            Hechas con amor,
            <br />
            desde 1987
          </div>
          <div style={{ fontSize: 12, color: '#C49060', marginTop: 4, fontWeight: 500 }}>
            Masa casera · Sin conservantes · Estilo sanjuanino
          </div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 44, flexShrink: 0 }}>🫔</div>
      </div>

      {/* Content */}
      <main style={{ paddingBottom: cantidadTotal > 0 ? 90 : 32 }}>
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#9A7A66' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🫔</div>
            <div style={{ fontWeight: 600 }}>Cargando menú…</div>
          </div>
        )}

        {isError && (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#dc2626' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>😕</div>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>No se pudo cargar el menú</div>
            <button
              onClick={() => refetch()}
              style={{
                padding: '10px 20px',
                background: '#C4522A',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reintentar
            </button>
          </div>
        )}

        {categorias?.map((cat) => (
          <CategoriaSection
            key={cat.id}
            categoria={cat}
            items={items}
            onAgregar={handleAgregar}
            onIncrementar={incrementar}
            onDecrementar={decrementar}
          />
        ))}

        <div
          style={{
            padding: '28px 16px',
            textAlign: 'center',
            background: '#2C1208',
          }}
        >
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 18,
              fontWeight: 800,
              color: '#FBF1D8',
              marginBottom: 6,
            }}
          >
            Huerto Empanadas
          </div>
          <div style={{ fontSize: 12, color: '#C49060', marginBottom: 4 }}>
            📍 Av. San Martín 4521, Villa del Parque
          </div>
          <div style={{ fontSize: 12, color: '#C49060' }}>⏰ Lun a Sab · 12 a 21hs</div>
        </div>
      </main>

      {/* FAB */}
      {cantidadTotal > 0 && (
        <button
          onClick={() => setCarritoOpen(true)}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 16,
            background: '#C4522A',
            border: 'none',
            borderRadius: 99,
            padding: '14px 20px 14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: 'white',
            fontFamily: "'Manrope', sans-serif",
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            zIndex: 50,
            boxShadow: '0 6px 20px rgba(196,82,42,0.5)',
            transition: 'transform 0.2s, background 0.2s',
          }}
        >
          <span className="icon" style={{ fontSize: 22 }}>shopping_bag</span>
          <span>Ver carrito</span>
          <div
            style={{
              background: '#D4920A',
              color: '#2C1208',
              borderRadius: 99,
              minWidth: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 800,
              padding: '0 6px',
            }}
          >
            {cantidadTotal}
          </div>
          <span style={{ marginLeft: 4, fontWeight: 600 }}>{fmt(total)}</span>
        </button>
      )}

      <Carrito
        open={carritoOpen}
        onClose={() => setCarritoOpen(false)}
        items={items}
        total={total}
        cantidadTotal={cantidadTotal}
        onIncrementar={incrementar}
        onDecrementar={decrementar}
        onConfirmar={handleConfirmar}
      />

      <FormularioPedido
        open={formularioOpen}
        onClose={() => setFormularioOpen(false)}
        items={items}
        total={total}
      />
    </div>
  )
}

function LogoMark() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="10" fill="#C4522A" />
      <path
        d="M8 22 Q12 10 18 14 Q24 18 28 10"
        stroke="#FBF1D8"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="18" cy="22" rx="8" ry="5" fill="#E8A838" opacity="0.9" />
      <path d="M10 22 Q14 28 18 27 Q22 28 26 22" stroke="#C4522A" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

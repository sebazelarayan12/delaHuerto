import { useState, useEffect } from 'react'
import { useMenu } from './hooks/useMenu'
import { useCarrito } from './hooks/useCarrito'
import CategoriaSection from './components/CategoriaSection'
import Carrito from './components/Carrito'
import FormularioPedido from './components/FormularioPedido'
import MenuHeader from './components/MenuHeader'
import CartFab from './components/CartFab'

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
    <div style={{ width: '100%', maxWidth: 430, minHeight: '100vh', background: '#FDF6EC', position: 'relative', overflow: 'hidden', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>

      <MenuHeader
        cantidadTotal={cantidadTotal}
        total={total}
        activeCat={activeCat}
        categorias={categorias ?? []}
        onOpenCarrito={() => setCarritoOpen(true)}
        onScrollToCategory={scrollToCategory}
      />

      <div style={{ background: 'linear-gradient(135deg, #3D1A0A 0%, #6B2D15 100%)', padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 800, color: '#FBF1D8', lineHeight: 1.3 }}>
            Hechas con amor,<br />desde 1987
          </div>
          <div style={{ fontSize: 12, color: '#C49060', marginTop: 4, fontWeight: 500 }}>
            Masa casera · Sin conservantes · Estilo sanjuanino
          </div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 44, flexShrink: 0 }}>🫔</div>
      </div>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
              style={{ padding: '10px 20px', background: '#C4522A', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}
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

        <div style={{ marginTop: 'auto', paddingTop: 40, paddingBottom: cantidadTotal > 0 ? 118 : 60, paddingLeft: 16, paddingRight: 16, textAlign: 'center', background: '#2C1208' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 800, color: '#FBF1D8', marginBottom: 6 }}>
            Huerto Empanadas
          </div>
          <div style={{ fontSize: 12, color: '#C49060', marginBottom: 4 }}>📍 Av. San Martín 4521, Villa del Parque</div>
          <div style={{ fontSize: 12, color: '#C49060' }}>⏰ Lun a Sab · 12 a 21hs</div>
        </div>
      </main>

      <CartFab cantidadTotal={cantidadTotal} total={total} onClick={() => setCarritoOpen(true)} />

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

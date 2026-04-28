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
  const { items, agregar, incrementar, decrementar, total, cantidadTotal, subtotal, montoDescuento, porcentajeDescuento, vaciar } = useCarrito()
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
    <div className="w-full max-w-[430px] min-h-screen bg-cream relative mx-auto flex flex-col">

      <MenuHeader
        cantidadTotal={cantidadTotal}
        total={total}
        activeCat={activeCat}
        categorias={categorias ?? []}
        onOpenCarrito={() => setCarritoOpen(true)}
        onScrollToCategory={scrollToCategory}
      />

      <div className="bg-gradient-to-br from-[#3D1A0A] to-[#6B2D15] px-4 py-5 flex items-center gap-3.5">
        <div>
          <div className="font-display text-lg font-extrabold text-gold-light leading-snug">
            Hechas con amor
          </div>
          <div className="text-xs text-[#C49060] mt-1 font-medium">
            Masa casera · Estilo tucumanas
          </div>
        </div>
        <div className="ml-auto text-[44px] shrink-0">🥟</div>
      </div>

      <main className="flex-1 flex flex-col">
        {isLoading && (
          <div className="text-center py-[60px] px-6 text-muted">
            <div className="text-[32px] mb-2">🥟</div>
            <div className="font-semibold">Cargando menú…</div>
          </div>
        )}

        {isError && (
          <div className="text-center py-[60px] px-6 text-red-600">
            <div className="text-[32px] mb-2">😕</div>
            <div className="font-semibold mb-3">No se pudo cargar el menú</div>
            <button
              onClick={() => refetch()}
              className="px-5 py-2.5 bg-terra text-white rounded-[10px] font-semibold cursor-pointer"
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
          <div style={{ fontSize: 12, color: '#C49060', marginBottom: 4 }}>📍 Don bosco, San Miguel de Tucuman</div>
          <div style={{ fontSize: 12, color: '#C49060' }}>⏰ Lun a Sab · 10 a 21hs</div>
        </div>
      </main>

      <CartFab cantidadTotal={cantidadTotal} total={total} onClick={() => setCarritoOpen(true)} />

      <Carrito
        open={carritoOpen}
        onClose={() => setCarritoOpen(false)}
        items={items}
        total={total}
        subtotal={subtotal}
        montoDescuento={montoDescuento}
        porcentajeDescuento={porcentajeDescuento}
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
        subtotal={subtotal}
        montoDescuento={montoDescuento}
        porcentajeDescuento={porcentajeDescuento}
        onSuccess={vaciar}
      />
    </div>
  )
}

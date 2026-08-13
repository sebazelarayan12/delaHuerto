import { useState, useEffect, useMemo } from 'react'
import { LazyMotion, domMax } from 'motion/react'
import { useMenu } from './hooks/useMenu'
import type { Categoria } from './hooks/useMenu'
import { useCarrito } from './hooks/useCarrito'
import { useBanner } from './hooks/useBanner'
import { calcularDescuentoParaCantidad } from './helpers/descuentos.helper'
import CategoriaSection from './components/CategoriaSection'
import Carrito from './components/Carrito'
import FormularioPedido from './components/FormularioPedido'
import MenuHeader from './components/MenuHeader'
import MenuStickyBar from './components/MenuStickyBar'
import CartFab from './components/CartFab'
import WhatsAppFab from './components/WhatsAppFab'
import ProductoCardSkeleton from './components/ProductoCardSkeleton'

const EMPTY_CATS: { id: number; nombre: string }[] = []

export default function MenuPage() {
  const { data: categorias, isLoading, isError, refetch } = useMenu()
  const { data: banner } = useBanner()
  const { items, agregar, incrementar, decrementar, subtotal, cantidadTotal, vaciar } = useCarrito()

  const { montoDescuento, total } = useMemo(() => {
    if (!categorias || !items.length) return { montoDescuento: 0, total: subtotal }
    const catMap = Object.fromEntries(categorias.map((c) => [c.id, c]))
    const grupos: Record<number, typeof items> = {}
    for (const item of items) {
      if (!grupos[item.categoriaId]) grupos[item.categoriaId] = []
      grupos[item.categoriaId].push(item)
    }
    let descuento = 0
    for (const [catIdStr, grupo] of Object.entries(grupos)) {
      const cat = catMap[Number(catIdStr)]
      if (!cat) continue
      const cantidadGrupo = grupo.reduce((s, i) => s + i.cantidad, 0)
      const pct = calcularDescuentoParaCantidad(cantidadGrupo, cat.descuentos ?? [])
      if (pct > 0) {
        const subtotalGrupo = grupo.reduce((s, i) => s + i.precio * i.cantidad, 0)
        descuento += subtotalGrupo * pct
      }
    }
    return { montoDescuento: descuento, total: subtotal - descuento }
  }, [items, categorias, subtotal])

  const productoMap = useMemo(() => {
    if (!categorias) return new Map<number, Categoria['productos'][number]>()
    return new Map(categorias.flatMap((c) => c.productos).map((p) => [p.id, p]))
  }, [categorias])

  const [carritoOpen, setCarritoOpen] = useState(false)
  const [formularioOpen, setFormularioOpen] = useState(false)
  const [activeCat, setActiveCat] = useState<number | null>(null)
  const [perfil, setPerfil] = useState<'cocinada' | 'congelada'>('cocinada')

  const effectiveActiveCat = activeCat ?? categorias?.[0]?.id ?? null

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
    const prod = productoMap.get(productoId)
    if (prod) agregar(prod, perfil)
  }

  return (
    <LazyMotion features={domMax}>
    <div className="menu-theme w-full max-w-[430px] md:max-w-3xl lg:max-w-6xl min-h-screen bg-cream relative mx-auto flex flex-col">

      <MenuHeader
        cantidadTotal={cantidadTotal}
        total={total}
        banner={banner}
        onOpenCarrito={() => setCarritoOpen(true)}
      />

      <MenuStickyBar
        activeCat={effectiveActiveCat}
        categorias={categorias ?? EMPTY_CATS}
        perfil={perfil}
        onPerfilChange={setPerfil}
        onScrollToCategory={scrollToCategory}
      />

      <div className="relative overflow-hidden px-4 pt-4 pb-3.5 bg-[#F7EFE2] border-b border-sand-deep">
        <div className="grain-overlay absolute inset-0 opacity-[0.06]" />
        <div className={`absolute -right-3 -top-3 size-[60px] rounded-full ${perfil === 'cocinada' ? 'bg-cocinada/[0.12]' : 'bg-congelada/[0.12]'}`} />
        <div className={`absolute right-4 -bottom-3 size-9 rounded-full ${perfil === 'cocinada' ? 'bg-cocinada/10' : 'bg-congelada/10'}`} />
        <div className="font-artisan text-[24px] font-black text-espresso leading-[1.1] mb-1.5 relative z-10">
          Hechas con <span className="italic text-terra">amor</span>
        </div>
        <div className="flex items-center gap-1.5 mb-1.5 relative z-10">
          <div className="flex-1 h-px bg-gold opacity-40" />
          <div className="size-1 rounded-full bg-gold opacity-60" />
          <div className="flex-1 h-px bg-gold opacity-40" />
        </div>
        <div className="text-[10px] font-semibold text-brown tracking-[0.08em] uppercase relative z-10">
          Masa casera · Estilo tucumanas
        </div>
      </div>

      <main className="flex-1 flex flex-col">
        {isLoading && (
          <div className="flex-1">
            {['sk-a', 'sk-b'].map((s) => (
              <div key={s}>
                <div className="pt-[18px] px-4 pb-3 bg-cream border-b border-sand">
                  <div className="h-7 w-40 rounded-lg bg-sand animate-pulse" />
                </div>
                <div className="bg-ivory px-3 pt-2.5 pb-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {['c1', 'c2', 'c3'].map((c) => (
                    <ProductoCardSkeleton key={`${s}-${c}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="text-center py-[60px] px-6 text-red-600">
            <span className="icon text-[32px] text-red-600 block mb-2">sentiment_dissatisfied</span>
            <div className="font-semibold mb-3">No se pudo cargar el menú</div>
            <button
              onClick={() => refetch()}
              className="px-5 py-2.5 bg-terra text-white rounded-[10px] font-semibold cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

        <div className="relative overflow-hidden">
          <div className={`pointer-events-none absolute -left-16 top-10 size-64 rounded-full blur-3xl ${perfil === 'cocinada' ? 'bg-cocinada/[0.14]' : 'bg-congelada/[0.14]'}`} />
          <div className={`pointer-events-none absolute -right-20 top-[38%] size-72 rounded-full blur-3xl ${perfil === 'cocinada' ? 'bg-cocinada/[0.12]' : 'bg-congelada/[0.12]'}`} />
          <div className={`pointer-events-none absolute -left-14 top-[68%] size-60 rounded-full blur-3xl ${perfil === 'cocinada' ? 'bg-cocinada/[0.12]' : 'bg-congelada/[0.12]'}`} />
          <div className={`pointer-events-none absolute -right-10 bottom-0 size-56 rounded-full blur-3xl ${perfil === 'cocinada' ? 'bg-cocinada/[0.10]' : 'bg-congelada/[0.10]'}`} />

          {categorias?.map((cat) => (
            <CategoriaSection
              key={cat.id}
              categoria={cat}
              items={items}
              perfil={perfil}
              onAgregar={handleAgregar}
              onIncrementar={incrementar}
              onDecrementar={decrementar}
            />
          ))}
        </div>

        <div className={`relative mt-auto pt-4 ${cantidadTotal > 0 ? 'pb-[88px]' : 'pb-4'} px-4 text-center bg-espresso overflow-hidden`}>
          <div className="diamond-pattern absolute inset-0 opacity-[0.06]" />
          <div className="relative z-10">
            <div className="font-display text-lg font-extrabold text-gold-light mb-1.5">
              De la Huerto Empanadas
            </div>
            <div className="text-xs text-gold-muted mb-1 flex items-center justify-center gap-1">
              <span className="icon text-sm">location_on</span>
              Don Bosco 2839, San Miguel de Tucuman
            </div>
            <div className="text-xs text-gold-muted flex items-center justify-center gap-1">
              <span className="icon text-sm">schedule</span>
              Lun a Sab · 10 a 21hs
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-6 right-4 z-50 flex items-center gap-2.5">
        <WhatsAppFab />
        <CartFab cantidadTotal={cantidadTotal} total={total} onClick={() => setCarritoOpen(true)} />
      </div>

      <Carrito
        open={carritoOpen}
        onClose={() => setCarritoOpen(false)}
        items={items}
        total={total}
        subtotal={subtotal}
        montoDescuento={montoDescuento}
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
        onSuccess={vaciar}
      />
    </div>
    </LazyMotion>
  )
}

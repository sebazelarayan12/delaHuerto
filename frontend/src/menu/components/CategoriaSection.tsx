import * as m from 'motion/react-m'
import type { Categoria } from '../hooks/useMenu'
import type { ItemCarrito } from '../hooks/useCarrito'
import ProductoCard from './ProductoCard'

interface Props {
  categoria: Categoria
  items: ItemCarrito[]
  perfil: 'cocinada' | 'congelada'
  onAgregar: (productoId: number) => void
  onIncrementar: (productoId: number, modalidad: 'cocinada' | 'congelada') => void
  onDecrementar: (productoId: number, modalidad: 'cocinada' | 'congelada') => void
  onAgregarCantidad: (productoId: number, cantidad: number) => void
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}

export default function CategoriaSection({ categoria, items, perfil, onAgregar, onIncrementar, onDecrementar, onAgregarCantidad }: Props) {
  const getCantidad = (productoId: number, modalidad: 'cocinada' | 'congelada') =>
    items.find((i) => i.productoId === productoId && i.modalidad === modalidad)?.cantidad ?? 0

  const productosFiltrados = categoria.productos.filter(
    (p) => perfil === 'congelada' || p.precioCocinada !== null
  )

  return (
    <section id={`cat-${categoria.id}`} className="relative z-10">
      <div className="pt-[18px] px-4 pb-3 bg-cream border-b border-sand">
        <div className="font-display text-[22px] font-extrabold text-espresso leading-[1.2]">
          {categoria.nombre}
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-px bg-gold/30" />
          <div className="size-1.5 bg-gold/60 rotate-45" />
          <div className="flex-1 h-px bg-gold/30" />
        </div>
      </div>
      <m.div
        key={perfil}
        className="px-3 pt-2.5 pb-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
      >
        {productosFiltrados.length === 0 ? (
          <div className="col-span-full py-10 flex flex-col items-center gap-2 text-center">
            <span className="icon text-[40px] text-sand-deep">restaurant_menu</span>
            <div className="font-artisan text-[17px] font-semibold text-brown italic">Volvemos pronto</div>
            <div className="text-[13px] text-muted">Sin stock hoy, revisa mas tarde</div>
          </div>
        ) : productosFiltrados.map((p) => (
          <ProductoCard
            key={p.id}
            producto={p}
            perfil={perfil}
            cantidad={getCantidad(p.id, perfil)}
            onAgregar={() => onAgregar(p.id)}
            onIncrementar={() => onIncrementar(p.id, perfil)}
            onDecrementar={() => onDecrementar(p.id, perfil)}
            onAgregarCantidad={(cantidad) => onAgregarCantidad(p.id, cantidad)}
          />
        ))}
      </m.div>
    </section>
  )
}

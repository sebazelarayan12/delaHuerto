import * as m from 'motion/react-m'
import type { Categoria } from '../hooks/useMenu'
import type { ItemCarrito } from '../hooks/useCarrito'
import ProductoCard from './ProductoCard'

interface Props {
  categoria: Categoria
  items: ItemCarrito[]
  onAgregar: (productoId: number) => void
  onIncrementar: (productoId: number) => void
  onDecrementar: (productoId: number) => void
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}

export default function CategoriaSection({ categoria, items, onAgregar, onIncrementar, onDecrementar }: Props) {
  const getCantidad = (productoId: number) =>
    items.find((i) => i.productoId === productoId)?.cantidad ?? 0

  return (
    <section id={`cat-${categoria.id}`}>
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
        className="bg-ivory px-3 pt-2.5 pb-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
      >
        {categoria.productos.length === 0 ? (
          <div className="col-span-full py-10 flex flex-col items-center gap-2 text-center">
            <span className="icon text-[40px] text-sand-deep">restaurant_menu</span>
            <div className="font-artisan text-[17px] font-semibold text-brown italic">Volvemos pronto</div>
            <div className="text-[13px] text-muted">Sin stock hoy, revisa mas tarde</div>
          </div>
        ) : categoria.productos.map((p) => (
          <ProductoCard
            key={p.id}
            producto={p}
            cantidad={getCantidad(p.id)}
            onAgregar={() => onAgregar(p.id)}
            onIncrementar={() => onIncrementar(p.id)}
            onDecrementar={() => onDecrementar(p.id)}
          />
        ))}
      </m.div>
    </section>
  )
}

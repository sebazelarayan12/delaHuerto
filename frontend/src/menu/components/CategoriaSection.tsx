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

export default function CategoriaSection({ categoria, items, onAgregar, onIncrementar, onDecrementar }: Props) {
  const getCantidad = (productoId: number) =>
    items.find((i) => i.productoId === productoId)?.cantidad ?? 0

  return (
    <section id={`cat-${categoria.id}`}>
      <div className="pt-[18px] px-4 pb-3 bg-cream border-b border-sand">
        <div className="font-display text-[22px] font-extrabold text-espresso leading-[1.2]">
          {categoria.nombre}
        </div>
      </div>
      <div className="bg-ivory px-3 pt-2.5 pb-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
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
      </div>
    </section>
  )
}

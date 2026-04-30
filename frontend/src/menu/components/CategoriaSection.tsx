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
      <div>
        {categoria.productos.length === 0 ? (
          <div className="py-6 px-4 text-center text-muted text-sm bg-ivory border-b border-sand">
            No hay productos disponibles para esta categoría en este momento.
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

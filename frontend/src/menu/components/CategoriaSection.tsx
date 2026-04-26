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
      <div
        style={{
          padding: '18px 16px 12px',
          background: '#FDF6EC',
          borderBottom: '1px solid #F3E8D8',
        }}
      >
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 22,
            fontWeight: 800,
            color: '#2C1208',
            lineHeight: 1.2,
          }}
        >
          {categoria.nombre}
        </div>
      </div>
      <div>
        {categoria.productos.map((p) => (
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

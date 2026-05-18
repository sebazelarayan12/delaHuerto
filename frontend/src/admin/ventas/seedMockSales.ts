import { api } from '../../api/axios'

const NOMBRES = [
  'Maria Gonzalez', 'Dylan Suarez', 'Laura Vidal', 'Sergio Perez',
  'Romina Costa', 'Cristian Diaz', 'Carla Romero', 'Ivan Acosta',
  'Sofia Nunez', 'Pedro Lorenzo',
]
const WEIGHTS = [0.6, 0.4, 0.5, 0.7, 1.0, 1.4, 1.3] // dom lun mar mie jue vie sab

interface Producto { id: number; precio: string }

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export async function seedMockSales(productos: Producto[]): Promise<void> {
  if (import.meta.env.PROD) {
    console.warn('seedMockSales: no corre en produccion')
    return
  }

  const today = new Date()
  let created = 0

  for (let i = 44; i >= 0; i--) {
    const day = new Date(today)
    day.setDate(today.getDate() - i)
    const w = WEIGHTS[day.getDay()]
    const count = Math.max(0, Math.round((Math.random() * 4 + 1) * w))

    for (let s = 0; s < count; s++) {
      const itemCount = Math.ceil(Math.random() * 3)
      const items = Array.from({ length: itemCount }, () => {
        const prod = pick(productos)
        const cantidad = Math.ceil(Math.random() * 3)
        return { productoId: prod.id, cantidad, precioUnitario: parseFloat(prod.precio) }
      })

      const hour = 11 + Math.floor(Math.random() * 10)
      const minute = Math.floor(Math.random() * 60)
      day.setHours(hour, minute, 0, 0)

      await api.post('/api/admin/ventas', {
        items,
        notas: pick(NOMBRES),
        fecha: day.toISOString(),
      })
      created++
    }
  }

  console.log(`seedMockSales: ${created} ventas creadas`)
}

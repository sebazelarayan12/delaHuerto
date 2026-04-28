import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/axios'

export interface Producto {
  id: number
  categoriaId: number
  nombre: string
  descripcion: string | null
  precio: string
  precioUnidad: string | null
  fotoUrl: string | null
  fotoPublicId: string | null
  disponible: boolean
  orden: number
  creadoEn: string
}

export interface DescuentoTier {
  id: number
  cantidadMinima: number
  porcentaje: number
}

export interface Categoria {
  id: number
  nombre: string
  orden: number
  activa: boolean
  creadaEn: string
  productos: Producto[]
  descuentos: DescuentoTier[]
}

export function useMenu() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const res = await api.get<Categoria[]>('/api/categorias')
      return res.data
    },
  })
}

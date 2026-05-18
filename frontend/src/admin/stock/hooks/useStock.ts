import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../api/axios'

export interface ProductoConStock {
  id: number
  nombre: string
  precio: string
  fotoUrl: string | null
  disponible: boolean
  stock: number
  stockMinimo: number
  categoria: { id: number; nombre: string }
}

export interface AjusteStock {
  id: number
  productoId: number
  cantidad: number
  motivo: string
  fecha: string
}

export const STOCK_STATUS = {
  OK: 'ok',
  BAJO: 'bajo',
  CRITICO: 'critico',
  SIN_STOCK: 'sin_stock',
} as const

export type StockStatus = (typeof STOCK_STATUS)[keyof typeof STOCK_STATUS]

export function getStockStatus(stock: number, stockMinimo: number): StockStatus {
  if (stock === 0) return STOCK_STATUS.SIN_STOCK
  if (stockMinimo > 0 && stock <= stockMinimo) return STOCK_STATUS.CRITICO
  if (stockMinimo > 0 && stock <= stockMinimo * 1.5) return STOCK_STATUS.BAJO
  return STOCK_STATUS.OK
}

export function useStock() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['stock', 'admin'],
    queryFn: async () => {
      const res = await api.get<ProductoConStock[]>('/api/admin/stock')
      return res.data
    },
  })

  const ajustar = useMutation({
    mutationFn: ({ id, cantidad, motivo }: { id: number; cantidad: number; motivo: string }) =>
      api.post(`/api/admin/stock/${id}/ajuste`, { cantidad, motivo }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock', 'admin'] })
      qc.invalidateQueries({ queryKey: ['dashboard', 'admin'] })
    },
  })

  return { query, ajustar }
}

export function useHistorialStock(productoId: number) {
  return useQuery({
    queryKey: ['stock', 'admin', productoId, 'historial'],
    queryFn: async () => {
      const res = await api.get<AjusteStock[]>(`/api/admin/stock/${productoId}/historial`)
      return res.data
    },
    enabled: productoId > 0,
  })
}

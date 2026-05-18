import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { AxiosError } from 'axios'
import { api } from '../../../api/axios'

interface ProductoResumen {
  id: number
  nombre: string
  fotoUrl: string | null
}

export interface ItemVentaAdmin {
  id: number
  ventaId: number
  productoId: number
  cantidad: number
  precioUnitario: string
  producto: ProductoResumen
}

export interface VentaAdmin {
  id: number
  fecha: string
  total: string
  notas: string | null
  items: ItemVentaAdmin[]
}

export interface ItemVentaInput {
  productoId: number
  cantidad: number
  precioUnitario: number
}

export function useVentas(desde?: string, hasta?: string) {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['ventas', 'admin', { desde, hasta }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (desde) params.set('desde', desde)
      if (hasta) params.set('hasta', hasta)
      const res = await api.get<VentaAdmin[]>(`/api/admin/ventas?${params.toString()}`)
      return res.data
    },
  })

  const registrar = useMutation({
    mutationFn: ({ items, notas, fecha }: { items: ItemVentaInput[]; notas?: string; fecha?: string }) =>
      api.post<VentaAdmin>('/api/admin/ventas', { items, notas, fecha }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ventas', 'admin'] })
      qc.invalidateQueries({ queryKey: ['stock', 'admin'] })
      qc.invalidateQueries({ queryKey: ['productos'] })
      qc.invalidateQueries({ queryKey: ['dashboard', 'admin'] })
    },
    onError: (error) => {
      const axiosError = error as AxiosError<{ error: string }>
      const msg = axiosError.response?.data?.error ?? 'Error al registrar la venta'
      toast.error(msg)
    },
  })

  const cancelar = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/ventas/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ventas', 'admin'] })
      qc.invalidateQueries({ queryKey: ['stock', 'admin'] })
      qc.invalidateQueries({ queryKey: ['productos'] })
      qc.invalidateQueries({ queryKey: ['dashboard', 'admin'] })
    },
  })

  return { query, registrar, cancelar }
}

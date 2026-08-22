import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../api/axios'
import type { CategoriaEgresoAdmin } from './useCategoriasEgreso'

export interface EgresoAdmin {
  id: number
  categoriaId: number
  categoria: CategoriaEgresoAdmin
  monto: string
  descripcion: string | null
  fecha: string
}

export interface EgresoInput {
  categoriaId: number
  monto: number
  descripcion?: string
  fecha?: string
}

export function useEgresos(desde?: string, hasta?: string) {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['egresos', 'admin', { desde, hasta }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (desde) params.set('desde', desde)
      if (hasta) params.set('hasta', hasta)
      const res = await api.get<EgresoAdmin[]>(`/api/admin/egresos?${params.toString()}`)
      return res.data
    },
  })

  const registrar = useMutation({
    mutationFn: (data: EgresoInput) => api.post<EgresoAdmin>('/api/admin/egresos', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['egresos', 'admin'] })
      qc.invalidateQueries({ queryKey: ['dashboard', 'admin'] })
    },
  })

  const cancelar = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/egresos/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['egresos', 'admin'] })
      qc.invalidateQueries({ queryKey: ['dashboard', 'admin'] })
    },
  })

  return { query, registrar, cancelar }
}

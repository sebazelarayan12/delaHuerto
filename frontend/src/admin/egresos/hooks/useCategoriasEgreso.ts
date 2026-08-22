import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../api/axios'

export interface CategoriaEgresoAdmin {
  id: number
  nombre: string
  activa: boolean
}

export function useCategoriasEgreso() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['categorias-egreso', 'admin'],
    queryFn: async () => (await api.get<CategoriaEgresoAdmin[]>('/api/admin/categorias-egreso')).data,
  })

  const crear = useMutation({
    mutationFn: (data: { nombre: string; activa: boolean }) =>
      api.post('/api/admin/categorias-egreso', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categorias-egreso', 'admin'] }),
  })

  const editar = useMutation({
    mutationFn: ({ id, ...data }: { id: number; nombre?: string; activa?: boolean }) =>
      api.put(`/api/admin/categorias-egreso/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categorias-egreso', 'admin'] }),
  })

  const eliminar = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/categorias-egreso/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categorias-egreso', 'admin'] }),
  })

  return { query, crear, editar, eliminar }
}

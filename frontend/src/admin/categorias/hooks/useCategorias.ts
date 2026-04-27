import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../api/axios'

export interface CategoriaAdmin {
  id: number
  nombre: string
  orden: number
  activa: boolean
  creadaEn: string
}

export function useCategorias() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['categorias', 'admin'],
    queryFn: async () => {
      const res = await api.get<CategoriaAdmin[]>('/api/admin/categorias')
      return res.data
    },
  })

  const crear = useMutation({
    mutationFn: (data: { nombre: string; orden: number; activa: boolean }) =>
      api.post('/api/admin/categorias', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categorias'] }),
  })

  const editar = useMutation({
    mutationFn: ({ id, ...data }: { id: number; nombre: string; orden: number; activa: boolean }) =>
      api.put(`/api/admin/categorias/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categorias'] }),
  })

  const toggleActiva = useMutation({
    mutationFn: ({ id, activa }: { id: number; activa: boolean }) =>
      api.put(`/api/admin/categorias/${id}`, { activa }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categorias'] }),
  })

  const eliminar = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/categorias/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categorias'] }),
  })

  return { query, crear, editar, toggleActiva, eliminar }
}

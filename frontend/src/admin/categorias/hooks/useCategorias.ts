import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../api/axios'

export interface DescuentoTier {
  id: number
  cantidadMinima: number
  porcentaje: number
}

export interface CategoriaAdmin {
  id: number
  nombre: string
  orden: number
  activa: boolean
  creadaEn: string
  descuentos: DescuentoTier[]
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

  const reordenar = useMutation({
    mutationFn: (ordenes: { id: number; orden: number }[]) => api.post('/api/admin/categorias/reorder', { ordenes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categorias'] }),
  })

  const syncDescuentos = useMutation({
    mutationFn: ({ id, tiers }: { id: number; tiers: { cantidadMinima: number; porcentaje: number }[] }) =>
      api.put(`/api/admin/categorias/${id}/descuentos`, tiers),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categorias'] }),
  })

  return { query, crear, editar, toggleActiva, eliminar, reordenar, syncDescuentos }
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../api/axios'

export interface ProductoAdmin {
  id: number
  categoriaId: number
  nombre: string
  descripcion: string | null
  precioCongelada: string
  precioUnidad: string | null
  precioCocinada: string | null
  fotoUrl: string | null
  fotoPublicId: string | null
  disponible: boolean
  orden: number
  creadoEn: string
  categoria: {
    id: number
    nombre: string
    activa: boolean
    orden: number
    creadaEn: string
  }
}

export function useProductos() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['productos', 'admin'],
    queryFn: async () => {
      const res = await api.get<ProductoAdmin[]>('/api/admin/productos')
      return res.data
    },
  })

  const crear = useMutation({
    mutationFn: (formData: FormData) =>
      api.post('/api/admin/productos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos'] })
      qc.invalidateQueries({ queryKey: ['categorias'] })
    },
  })

  const editar = useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) =>
      api.put(`/api/admin/productos/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos'] })
      qc.invalidateQueries({ queryKey: ['categorias'] })
    },
  })

  const toggleDisponible = useMutation({
    mutationFn: ({ id, disponible }: { id: number; disponible: boolean }) => {
      const fd = new FormData()
      fd.append('disponible', String(disponible))
      return api.put<ProductoAdmin>(`/api/admin/productos/${id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onMutate: async ({ id, disponible }) => {
      await qc.cancelQueries({ queryKey: ['productos', 'admin'] })
      const previous = qc.getQueryData<ProductoAdmin[]>(['productos', 'admin'])
      qc.setQueryData<ProductoAdmin[]>(['productos', 'admin'], (old) =>
        old?.map((p) => (p.id === id ? { ...p, disponible } : p))
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(['productos', 'admin'], context.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['productos'] })
      qc.invalidateQueries({ queryKey: ['categorias'] })
    },
  })

  const eliminar = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/productos/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos'] })
      qc.invalidateQueries({ queryKey: ['categorias'] })
      qc.invalidateQueries({ queryKey: ['stock', 'admin'] })
    },
  })

  const reordenar = useMutation({
    mutationFn: (ordenes: { id: number; orden: number }[]) =>
      api.put('/api/admin/productos/reorder', { ordenes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos'] })
    },
  })

  return { query, crear, editar, toggleDisponible, eliminar, reordenar }
}

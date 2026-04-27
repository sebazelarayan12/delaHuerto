import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../api/axios'

export interface ProductoAdmin {
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
      return api.put(`/api/admin/productos/${id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos'] })
      qc.invalidateQueries({ queryKey: ['categorias'] })
    },
  })

  const eliminar = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/productos/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos'] })
      qc.invalidateQueries({ queryKey: ['categorias'] })
    },
  })

  return { query, crear, editar, toggleDisponible, eliminar }
}

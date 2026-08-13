import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { AxiosError } from 'axios'
import { api } from '../../../api/axios'
import type { EstadoPedido } from '../helpers/pedido.helpers'

interface ProductoResumen {
  id: number
  nombre: string
  fotoUrl: string | null
}

export interface ItemPedidoAdmin {
  id: number
  productoId: number
  cantidad: number
  precioUnitario: string
  modalidad: 'cocinada' | 'congelada'
  producto: ProductoResumen
}

export interface PedidoAdmin {
  id: number
  estado: EstadoPedido
  nombre: string
  telefono: string | null
  direccion: string | null
  notas: string | null
  fechaEntrega: string
  total: string
  ventaId: number | null
  items: ItemPedidoAdmin[]
  creadoEn: string
}

export interface CreatePedidoInput {
  nombre: string
  telefono?: string
  direccion?: string
  notas?: string
  fechaEntrega: string
  items: { productoId: number; cantidad: number; precioUnitario: number; modalidad: 'cocinada' | 'congelada' }[]
}

export function usePedidos() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['pedidos', 'admin'],
    queryFn: async () => {
      const res = await api.get<PedidoAdmin[]>('/api/admin/pedidos')
      return res.data
    },
    refetchInterval: 30_000,
  })

  const crearPedido = useMutation({
    mutationFn: (data: CreatePedidoInput) => api.post<PedidoAdmin>('/api/admin/pedidos', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pedidos', 'admin'] })
      toast.success('Pedido creado')
    },
    onError: (error) => {
      const msg = (error as AxiosError<{ error: string }>).response?.data?.error ?? 'Error al crear el pedido'
      toast.error(msg)
    },
  })

  const cambiarEstado = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: 'por_entregar' | 'entregado' | 'cancelado' }) =>
      api.patch<PedidoAdmin>(`/api/admin/pedidos/${id}/estado`, { estado }),
    onSuccess: (_, { estado }) => {
      qc.invalidateQueries({ queryKey: ['pedidos', 'admin'] })
      if (estado === 'por_entregar') {
        qc.invalidateQueries({ queryKey: ['ventas', 'admin'] })
        qc.invalidateQueries({ queryKey: ['stock', 'admin'] })
        qc.invalidateQueries({ queryKey: ['dashboard', 'admin'] })
        qc.invalidateQueries({ queryKey: ['productos', 'admin'] })
      }
    },
    onError: (error) => {
      const msg = (error as AxiosError<{ error: string }>).response?.data?.error ?? 'Error al actualizar el pedido'
      toast.error(msg)
    },
  })

  const eliminarPedido = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/pedidos/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pedidos', 'admin'] })
    },
    onError: (error) => {
      const msg = (error as AxiosError<{ error: string }>).response?.data?.error ?? 'Error al eliminar el pedido'
      toast.error(msg)
    },
  })

  return { query, crearPedido, cambiarEstado, eliminarPedido }
}

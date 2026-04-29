import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/axios'

export interface Banner {
  id: number
  titulo: string
  linea1: string
  linea2: string
  activo: boolean
}

export function useBanner() {
  return useQuery({
    queryKey: ['banner'],
    queryFn: async () => {
      const res = await api.get<Banner>('/api/banner')
      return res.data
    },
  })
}

import { useQuery } from '@tanstack/react-query'
import { api } from '../../../api/axios'

interface PeriodTotals {
  hoy: number
  semana: number
  mes: number
  total: number
}

interface DailySeries {
  ventas: number[]
  egresos: number[]
  neto: number[]
}

interface StockAlerta {
  id: number
  nombre: string
  stock: number
  stockMinimo: number
  fotoUrl: string | null
}

export interface DashboardResumen {
  revenue: PeriodTotals
  egresos: PeriodTotals
  neto: PeriodTotals
  ventas: { hoy: number; semana: number; mes: number; total: number }
  dailySeries: DailySeries
  stockAlertas: StockAlerta[]
}

export function useDashboardResumen() {
  return useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: async () => (await api.get<DashboardResumen>('/api/admin/dashboard')).data,
  })
}

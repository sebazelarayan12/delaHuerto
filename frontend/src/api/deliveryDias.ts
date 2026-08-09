import { api } from './axios'

export const deliveryDiasApi = {
  get: () => api.get<{ dias: boolean[] }>('/api/delivery-dias').then((r) => r.data.dias),

  update: (dias: boolean[]) =>
    api.put<{ dias: boolean[] }>('/api/admin/delivery-dias', { dias }).then((r) => r.data.dias),
}

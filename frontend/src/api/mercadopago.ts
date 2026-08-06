import { api } from './axios'

export interface MercadoPagoStatus {
  connected: boolean
  mpUserId?: string
  conectadoEn?: string
  expiresAt?: string
}

export const mercadopagoApi = {
  getStatus: () => api.get<MercadoPagoStatus>('/api/admin/mercadopago/status').then((r) => r.data),
  authorize: () => api.get<{ url: string }>('/api/admin/mercadopago/authorize').then((r) => r.data),
}

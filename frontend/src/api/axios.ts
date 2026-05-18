import axios from 'axios'
import { config } from '../config/env'

export const api = axios.create({
  baseURL: config.apiUrl,
})

api.interceptors.request.use((req) => {
  const token = localStorage.getItem('empanadas_admin_token')
  if (token) req.headers.Authorization = `Bearer ${token}`
  return req
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/api/auth/login')
    if (!isLoginRequest && error.response?.status === 401) {
      localStorage.removeItem('empanadas_admin_token')
      window.location.href = '/admin/login'
    }
    return Promise.reject(error)
  }
)

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

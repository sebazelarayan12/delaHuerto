import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'
import { prisma } from '../db.js'
import { env, modo } from '../env.js'

// Regla dura: en produccion, si no hay una cuenta de MP conectada via OAuth,
// JAMAS se usa el MP_ACCESS_TOKEN estatico (es del desarrollador, no del cliente)
// para crear preferencias ni consultar pagos. Devuelve null y quien llama debe
// cortar el flujo (503 en checkout, log + procesado:false en el webhook).
export async function getMpAccessToken(): Promise<string | null> {
  const connection = await prisma.mercadoPagoConnection.findFirst()
  if (connection && connection.expiresAt > new Date() && connection.intentosFallidos < 3) return connection.accessToken
  if (modo === 'production') return null
  return env.MP_ACCESS_TOKEN
}

export async function getMpPreferenceClient(): Promise<Preference | null> {
  const accessToken = await getMpAccessToken()
  if (!accessToken) return null
  return new Preference(new MercadoPagoConfig({ accessToken }))
}

export async function getMpPaymentClient(): Promise<Payment | null> {
  const accessToken = await getMpAccessToken()
  if (!accessToken) return null
  return new Payment(new MercadoPagoConfig({ accessToken }))
}

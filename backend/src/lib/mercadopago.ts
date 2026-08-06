import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'
import { env } from '../env.js'

export const mpClient = new MercadoPagoConfig({
  accessToken: env.MP_ACCESS_TOKEN,
})

export const mpPreference = new Preference(mpClient)
export const mpPayment = new Payment(mpClient)

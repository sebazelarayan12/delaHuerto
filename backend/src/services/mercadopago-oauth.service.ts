import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../db.js'
import { env } from '../env.js'

const MP_OAUTH_AUTHORIZE_URL = 'https://auth.mercadopago.com/authorization'
const MP_OAUTH_TOKEN_URL = 'https://api.mercadopago.com/oauth/token'
const CALLBACK_PATH = '/api/webhooks/mercadopago/oauth/callback'

const mpOAuthTokenResponseSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string(),
  expires_in: z.number(),
  scope: z.string(),
  user_id: z.number(),
  refresh_token: z.string().min(1),
  public_key: z.string().min(1),
  live_mode: z.boolean(),
})

type MpOAuthTokenResponse = z.infer<typeof mpOAuthTokenResponseSchema>

export class MercadoPagoOAuthService {
  static signState(): string {
    return jwt.sign({ purpose: 'mp-oauth-state' }, env.JWT_SECRET, { expiresIn: '10m' })
  }

  static verifyState(state: string): boolean {
    try {
      const decoded = jwt.verify(state, env.JWT_SECRET) as jwt.JwtPayload
      return decoded.purpose === 'mp-oauth-state'
    } catch {
      return false
    }
  }

  static buildAuthorizationUrl(): string {
    if (!env.MP_CLIENT_ID) {
      throw new Error('MP_CLIENT_ID no configurada - no se puede iniciar el flujo OAuth de Mercado Pago')
    }
    const state = MercadoPagoOAuthService.signState()
    const redirectUri = `${env.BACKEND_URL}${CALLBACK_PATH}`
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: env.MP_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: 'offline_access',
      state,
    })
    return `${MP_OAUTH_AUTHORIZE_URL}?${params.toString()}`
  }

  static async exchangeCodeForToken(code: string): Promise<MpOAuthTokenResponse> {
    if (!env.MP_CLIENT_ID || !env.MP_CLIENT_SECRET) {
      throw new Error('MP_CLIENT_ID/MP_CLIENT_SECRET no configuradas - no se puede completar el flujo OAuth de Mercado Pago')
    }
    const redirectUri = `${env.BACKEND_URL}${CALLBACK_PATH}`
    const response = await fetch(MP_OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: env.MP_CLIENT_ID,
        client_secret: env.MP_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    })
    if (!response.ok) {
      const body = await response.text()
      throw new Error(`MP oauth/token (authorization_code) fallo: ${response.status} ${body}`)
    }
    const json = await response.json()
    return mpOAuthTokenResponseSchema.parse(json)
  }

  static async refreshToken(refreshToken: string): Promise<MpOAuthTokenResponse> {
    if (!env.MP_CLIENT_ID || !env.MP_CLIENT_SECRET) {
      throw new Error('MP_CLIENT_ID/MP_CLIENT_SECRET no configuradas - no se puede renovar el token de Mercado Pago')
    }
    const response = await fetch(MP_OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: env.MP_CLIENT_ID,
        client_secret: env.MP_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })
    if (!response.ok) {
      const body = await response.text()
      throw new Error(`MP oauth/token (refresh_token) fallo: ${response.status} ${body}`)
    }
    const json = await response.json()
    return mpOAuthTokenResponseSchema.parse(json)
  }

  static async saveConnection(token: MpOAuthTokenResponse) {
    const expiresAt = new Date(Date.now() + token.expires_in * 1000)
    const existing = await prisma.mercadoPagoConnection.findFirst()
    const data = {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      publicKey: token.public_key,
      mpUserId: String(token.user_id),
      expiresAt,
      intentosFallidos: 0,
    }
    if (existing) {
      return prisma.mercadoPagoConnection.update({ where: { id: existing.id }, data })
    }
    return prisma.mercadoPagoConnection.create({ data })
  }

  static async getConnection() {
    return prisma.mercadoPagoConnection.findFirst()
  }

  static async registrarFalloRefresh(connectionId: number): Promise<number> {
    const updated = await prisma.mercadoPagoConnection.update({
      where: { id: connectionId },
      data: { intentosFallidos: { increment: 1 } },
    })
    return updated.intentosFallidos
  }

  static async getStatus() {
    const connection = await MercadoPagoOAuthService.getConnection()
    if (!connection) return { connected: false as const }
    return {
      connected: true as const,
      mpUserId: connection.mpUserId,
      conectadoEn: connection.conectadoEn,
      expiresAt: connection.expiresAt,
    }
  }
}

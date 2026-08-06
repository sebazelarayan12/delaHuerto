import jwt from 'jsonwebtoken'
import { prisma } from '../db.js'
import { env } from '../env.js'

const MP_OAUTH_AUTHORIZE_URL = 'https://auth.mercadopago.com/authorization'
const MP_OAUTH_TOKEN_URL = 'https://api.mercadopago.com/oauth/token'
const CALLBACK_PATH = '/api/webhooks/mercadopago/oauth/callback'

interface MpOAuthTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
  user_id: number
  refresh_token: string
  public_key: string
  live_mode: boolean
}

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
    return response.json() as Promise<MpOAuthTokenResponse>
  }

  static async refreshToken(refreshToken: string): Promise<MpOAuthTokenResponse> {
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
    return response.json() as Promise<MpOAuthTokenResponse>
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
    }
    if (existing) {
      return prisma.mercadoPagoConnection.update({ where: { id: existing.id }, data })
    }
    return prisma.mercadoPagoConnection.create({ data })
  }

  static async getConnection() {
    return prisma.mercadoPagoConnection.findFirst()
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

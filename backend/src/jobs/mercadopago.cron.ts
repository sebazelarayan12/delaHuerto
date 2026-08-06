import cron from 'node-cron'
import { MercadoPagoOAuthService } from '../services/mercadopago-oauth.service.js'
import { NotificationsService } from '../services/notifications.service.js'

const QUINCE_DIAS_MS = 15 * 24 * 60 * 60 * 1000

export function startMercadoPagoCron() {
  cron.schedule('0 6 * * *', async () => {
    try {
      const connection = await MercadoPagoOAuthService.getConnection()
      if (!connection) return

      const vencePronto = connection.expiresAt.getTime() - Date.now() < QUINCE_DIAS_MS
      if (!vencePronto) return

      const token = await MercadoPagoOAuthService.refreshToken(connection.refreshToken)
      await MercadoPagoOAuthService.saveConnection(token)
      console.log('[CRON] Token de Mercado Pago renovado')
    } catch (err) {
      console.error('[CRON] Error renovando token de Mercado Pago:', err)
      const connection = await MercadoPagoOAuthService.getConnection()
      if (connection) {
        const intentos = await MercadoPagoOAuthService.registrarFalloRefresh(connection.id)
        if (intentos <= 3) {
          await NotificationsService.notifyAdmins(
            'Mercado Pago desconectado',
            'No se pudo renovar la conexion. Los pagos online estan deshabilitados hasta reconectar desde el panel.'
          )
        }
      }
    }
  })

  console.log('[CRON] Renovacion de Mercado Pago iniciada')
}

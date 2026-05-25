import cron from 'node-cron'
import { NotificationsService } from '../services/notifications.service.js'

export function startNotificationsCron() {
  cron.schedule('* * * * *', async () => {
    try {
      await NotificationsService.sendDailyReminderIfNeeded()
    } catch (err) {
      console.error('[CRON] Error en notificaciones:', err)
    }
  })

  console.log('[CRON] Notificaciones iniciadas')
}

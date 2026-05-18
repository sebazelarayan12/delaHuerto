import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { DashboardService } from '../services/dashboard.service.js'

const admin = new Hono()
admin.use('/*', authMiddleware)

admin.get('/', async (c) => {
  const summary = await DashboardService.getSummary()
  return c.json(summary)
})

export { admin as dashboardAdminRoutes }

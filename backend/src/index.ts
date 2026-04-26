import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { env } from './env.js'
import authRoutes from './routes/auth.routes.js'
import { categoriasPublicRoutes, categoriasAdminRoutes } from './routes/categorias.routes.js'
import { productosAdminRoutes } from './routes/productos.routes.js'

const app = new Hono()

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: [env.ALLOWED_ORIGIN, 'http://localhost:5173'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
)

app.route('/api/auth', authRoutes)
app.route('/api/categorias', categoriasPublicRoutes)
app.route('/api/admin/categorias', categoriasAdminRoutes)
app.route('/api/admin/productos', productosAdminRoutes)

app.get('/health', (c) => c.json({ ok: true }))

const port = env.PORT
console.log(`Server running on http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}

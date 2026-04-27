import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { env } from './env.js'
import { db } from './db.js'
import authRoutes from './routes/auth.routes.js'
import { categoriasPublicRoutes, categoriasAdminRoutes } from './routes/categorias.routes.js'
import { productosAdminRoutes } from './routes/productos.routes.js'

const isProd = process.env.NODE_ENV === 'production'

const allowedOrigins = isProd
  ? [env.ALLOWED_ORIGIN]
  : [env.ALLOWED_ORIGIN, 'http://localhost:5173']

const app = new Hono()

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: allowedOrigins,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
)

app.route('/api/auth', authRoutes)
app.route('/api/categorias', categoriasPublicRoutes)
app.route('/api/admin/categorias', categoriasAdminRoutes)
app.route('/api/admin/productos', productosAdminRoutes)

app.get('/health', async (c) => {
  try {
    await db.$queryRaw`SELECT 1`
    return c.json({ ok: true, db: 'connected' })
  } catch {
    return c.json({ ok: false, db: 'unreachable' }, 503)
  }
})

app.onError((err, c) => {
  console.error('[ERROR]', err)
  const origin = c.req.header('Origin') ?? ''
  if (allowedOrigins.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin)
    c.header('Vary', 'Origin')
  }
  return c.json({ error: 'Internal server error' }, 500)
})

const port = env.PORT

serve({ fetch: app.fetch, port }, () => {
  console.log(`Server running on http://localhost:${port}`)
})

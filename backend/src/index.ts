import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { env } from './env.js'
import { prisma } from './db.js'
import authRoutes from './routes/auth.routes.js'
import { categoriasPublicRoutes, categoriasAdminRoutes } from './routes/categorias.routes.js'
import { productosAdminRoutes } from './routes/productos.routes.js'
import { bannerPublicRoutes, bannerAdminRoutes } from './routes/banner.routes.js'
import { HttpError } from './utils/errors.js'

const isProd = process.env.NODE_ENV === 'production'

const allowedOrigins = env.ALLOWED_ORIGIN.split(',').map(o => o.trim())
if (!isProd && !allowedOrigins.includes('http://localhost:5173')) {
  allowedOrigins.push('http://localhost:5173')
}

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
app.route('/api/banner', bannerPublicRoutes)
app.route('/api/admin/banner', bannerAdminRoutes)

app.get('/health', async (c) => {
  try {
    await prisma.$queryRaw`SELECT 1`
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

  if (err instanceof HttpError) {
    return c.json({ error: err.message }, err.status as any)
  }

  // Handle Prisma 'Not Found' errors automatically if they bubble up
  if (typeof err === 'object' && err !== null && 'code' in err && (err as any).code === 'P2025') {
    return c.json({ error: 'Recurso no encontrado' }, 404)
  }

  return c.json({ error: 'Internal server error', details: err instanceof Error ? err.message : String(err) }, 500)
})

const port = env.PORT

console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('ALLOWED_ORIGIN:', JSON.stringify(env.ALLOWED_ORIGIN))
console.log('allowedOrigins:', allowedOrigins)

serve({ fetch: app.fetch, port }, () => {
  console.log(`Server running on http://localhost:${port}`)
})

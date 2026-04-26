import { createMiddleware } from 'hono/factory'
import jwt from 'jsonwebtoken'
import { env } from '../env.js'

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const token = authHeader.slice(7)
  try {
    jwt.verify(token, env.JWT_SECRET)
    await next()
  } catch {
    return c.json({ error: 'Token inválido o expirado' }, 401)
  }
})

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
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as jwt.JwtPayload
    c.set('jwtPayload', decoded)
    await next()
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      console.warn('JWT expirado')
    } else if (err instanceof jwt.JsonWebTokenError) {
      console.warn('JWT invalido:', err.message)
    }
    return c.json({ error: 'Token invalido o expirado' }, 401)
  }
})

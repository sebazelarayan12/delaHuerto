import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import { env } from '../env.js'

const app = new Hono()

app.post(
  '/login',
  zValidator('json', z.object({ username: z.string(), password: z.string() })),
  async (c) => {
    const { username, password } = c.req.valid('json')
    if (username !== env.ADMIN_USERNAME || password !== env.ADMIN_PASSWORD) {
      return c.json({ error: 'Usuario o contraseña incorrectos' }, 401)
    }
    const token = jwt.sign({ sub: username, role: 'admin' }, env.JWT_SECRET, { expiresIn: '7d' })
    return c.json({ token })
  }
)

export default app

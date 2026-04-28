import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { AuthService } from '../services/auth.service.js'

const app = new Hono()

app.post(
  '/login',
  zValidator('json', z.object({ username: z.string(), password: z.string() })),
  async (c) => {
    const { username, password } = c.req.valid('json')
    const result = AuthService.login(username, password)
    return c.json(result)
  }
)

export default app

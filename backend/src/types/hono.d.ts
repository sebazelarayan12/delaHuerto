import 'hono'
import type { JwtPayload } from 'jsonwebtoken'

declare module 'hono' {
  interface ContextVariableMap {
    jwtPayload: JwtPayload
  }
}

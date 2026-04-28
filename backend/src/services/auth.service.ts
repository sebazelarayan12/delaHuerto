import jwt from 'jsonwebtoken'
import { env } from '../env.js'
import { UnauthorizedError } from '../utils/errors.js'

export class AuthService {
  static login(username: string, password: string) {
    if (username !== env.ADMIN_USERNAME || password !== env.ADMIN_PASSWORD) {
      throw new UnauthorizedError('Usuario o contraseña incorrectos')
    }
    const token = jwt.sign({ sub: username, role: 'admin' }, env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' })
    return { token }
  }
}

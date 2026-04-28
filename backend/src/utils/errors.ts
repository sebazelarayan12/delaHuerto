export class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'HttpError'
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'No encontrado') {
    super(404, message)
  }
}

export class ConflictError extends HttpError {
  constructor(message = 'Conflicto') {
    super(409, message)
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'No autorizado') {
    super(401, message)
  }
}

import { Page } from '@playwright/test'

export const ADMIN_URL = 'http://localhost:3000'

// JWT con exp=9999999999 (año ~2286) — pasa isTokenValid() sin backend real
export const FAKE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk5OTk5OTk5OTl9.fake-signature'

export async function loginViaAPI(page: Page): Promise<void> {
  const username = process.env.ADMIN_USERNAME ?? 'admin'
  const password = process.env.ADMIN_PASSWORD ?? 'admin'

  await page.addInitScript(
    ({ apiUrl, user, pass }) => {
      const stored = localStorage.getItem('empanadas_admin_token')
      if (stored) return
      fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.token) localStorage.setItem('empanadas_admin_token', data.token)
        })
    },
    { apiUrl: ADMIN_URL, user: username, pass: password }
  )
}

export function mockCategoriasResponse(page: Page) {
  return page.route('**/api/categorias', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 1,
          nombre: 'Carne',
          activa: true,
          orden: 0,
          descuentos: [],
          productos: [
            {
              id: 1,
              nombre: 'Empanada de carne',
              descripcion: 'Con cebolla y huevo',
              precio: '350.00',
              precioUnidad: null,
              fotoUrl: null,
              disponible: true,
              orden: 0,
            },
            {
              id: 2,
              nombre: 'Empanada sin stock',
              descripcion: 'Agotada',
              precio: '300.00',
              precioUnidad: null,
              fotoUrl: null,
              disponible: false,
              orden: 1,
            },
          ],
        },
      ]),
    })
  )
}

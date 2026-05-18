import { test, expect } from '@playwright/test'
import { AuthPage } from './auth-page'
import { FAKE_JWT } from '../helpers'

test.describe('Auth admin', () => {
  test('acceso directo a /admin sin token redirige a login',
    { tag: ['@critical', '@e2e', '@auth', '@AUTH-E2E-001'] },
    async ({ page }) => {
      await page.goto('/admin')
      await expect(page).toHaveURL(/\/admin\/login/)
    }
  )

  test('login con credenciales incorrectas muestra error',
    { tag: ['@critical', '@e2e', '@auth', '@AUTH-E2E-002'] },
    async ({ page }) => {
      await page.route('**/api/auth/login', (route) =>
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Credenciales invalidas' }),
        })
      )

      const auth = new AuthPage(page)
      await auth.goto()
      await auth.login('wrong', 'wrong')

      await expect(page.getByText('Usuario o contrasena incorrectos')).toBeVisible()
    }
  )

  test('login con credenciales correctas redirige al panel',
    { tag: ['@critical', '@e2e', '@auth', '@AUTH-E2E-003'] },
    async ({ page }) => {
      // admin catch-all primero (LIFO: más baja prioridad)
      await page.route('**/api/admin/**', (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
      )
      // login específico después (LIFO: más alta prioridad)
      await page.route('**/api/auth/login', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ token: FAKE_JWT }),
        })
      )

      const auth = new AuthPage(page)
      await auth.goto()
      await auth.login('admin', 'admin')

      await expect(page).toHaveURL(/\/admin/)
      await expect(page).not.toHaveURL(/\/admin\/login/)
    }
  )
})

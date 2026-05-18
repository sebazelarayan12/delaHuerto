import { test, expect } from '@playwright/test'
import { MenuPage } from './menu-page'
import { mockCategoriasResponse } from '../helpers'

test.describe('Menu publico', () => {
  test.beforeEach(async ({ page }) => {
    await mockCategoriasResponse(page)
    await page.route('**/api/banner', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ activo: false }) })
    )
  })

  test('carga categorias y productos',
    { tag: ['@critical', '@e2e', '@menu', '@MENU-E2E-001'] },
    async ({ page }) => {
      const menu = new MenuPage(page)
      await menu.goto()

      await expect(page.getByRole('button', { name: 'Carne', exact: true })).toBeVisible()
      await expect(page.getByText('Empanada de carne', { exact: true })).toBeVisible()
    }
  )

  test('producto sin stock muestra badge y no permite agregar',
    { tag: ['@critical', '@e2e', '@menu', '@MENU-E2E-002'] },
    async ({ page }) => {
      const menu = new MenuPage(page)
      await menu.goto()

      const card = page.locator('.rounded-2xl').filter({ hasText: 'Empanada sin stock' })
      await expect(card.getByText('Sin stock', { exact: true })).toBeVisible()
      await expect(card.getByRole('button', { name: /agregar/i })).not.toBeVisible()
    }
  )

  test('agregar producto al carrito actualiza el header',
    { tag: ['@high', '@e2e', '@menu', '@MENU-E2E-003'] },
    async ({ page }) => {
      const menu = new MenuPage(page)
      await menu.goto()

      await page.getByRole('button', { name: /agregar empanada de carne/i }).click()

      await expect(page.locator('span.bg-terra.rounded-full').filter({ hasText: '1' })).toBeVisible()
    }
  )

  test('responsive: 2 columnas en tablet',
    { tag: ['@medium', '@e2e', '@menu', '@MENU-E2E-004'] },
    async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      const menu = new MenuPage(page)
      await menu.goto()

      const grid = page.locator('.grid')
      await expect(grid).toHaveCSS('grid-template-columns', /\d+px \d+px/)
    }
  )
})

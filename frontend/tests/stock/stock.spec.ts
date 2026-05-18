import { test, expect } from '@playwright/test'
import { StockPage } from './stock-page'
import { FAKE_JWT } from '../helpers'

const PRODUCTOS_MOCK = [
  {
    id: 1,
    nombre: 'Empanada de carne',
    precio: '350.00',
    fotoUrl: null,
    disponible: true,
    stock: 5,
    stockMinimo: 2,
    categoria: { id: 1, nombre: 'Carne' },
  },
  {
    id: 2,
    nombre: 'Empanada sin stock',
    precio: '300.00',
    fotoUrl: null,
    disponible: false,
    stock: 0,
    stockMinimo: 3,
    categoria: { id: 1, nombre: 'Carne' },
  },
]

async function setup(page: import('@playwright/test').Page) {
  await page.addInitScript((jwt) => {
    localStorage.setItem('empanadas_admin_token', jwt)
  }, FAKE_JWT)

  // catch-all de admin primero (LIFO: prioridad más baja)
  await page.route('**/api/admin/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  )
  // específica después (LIFO: prioridad más alta)
  await page.route('**/api/admin/stock', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PRODUCTOS_MOCK) })
  )
}

test.describe('Admin — Stock', () => {
  test('pagina de stock carga con tabla de productos',
    { tag: ['@critical', '@e2e', '@stock', '@STOCK-E2E-001'] },
    async ({ page }) => {
      await setup(page)
      const stock = new StockPage(page)
      await stock.goto()

      await expect(stock.heading).toBeVisible()
      await expect(page.getByText('Empanada de carne')).toBeVisible()
    }
  )

  test('producto con stock 0 muestra badge Sin stock',
    { tag: ['@critical', '@e2e', '@stock', '@STOCK-E2E-002'] },
    async ({ page }) => {
      await setup(page)
      const stock = new StockPage(page)
      await stock.goto()

      const row = page.locator('.divide-y > div').filter({ hasText: 'Empanada sin stock' })
      await expect(row.getByText('Sin stock', { exact: true })).toBeVisible()
    }
  )

  test('producto con stock OK muestra badge verde',
    { tag: ['@high', '@e2e', '@stock', '@STOCK-E2E-003'] },
    async ({ page }) => {
      await setup(page)
      const stock = new StockPage(page)
      await stock.goto()

      const row = page.locator('.divide-y > div').filter({ hasText: 'Empanada de carne' })
      await expect(row.getByText('OK', { exact: true })).toBeVisible()
    }
  )
})

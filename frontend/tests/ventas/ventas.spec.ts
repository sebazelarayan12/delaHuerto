import { test, expect } from '@playwright/test'
import { VentasPage } from './ventas-page'
import { FAKE_JWT } from '../helpers'

const PRODUCTO_MOCK = {
  id: 1,
  nombre: 'Empanada de carne',
  descripcion: 'Con cebolla y huevo',
  precio: '350.00',
  precioUnidad: null,
  fotoUrl: null,
  disponible: true,
  stock: 2,
  stockMinimo: 0,
  orden: 0,
  categoriaId: 1,
}

async function setup(page: import('@playwright/test').Page) {
  // addInitScript antes de navegar — corre antes de que React monte
  await page.addInitScript((jwt) => {
    localStorage.setItem('empanadas_admin_token', jwt)
  }, FAKE_JWT)

  // catch-all de admin primero (LIFO: prioridad más baja)
  // Nota: evitamos **/api/** porque matchea src/api/axios.ts en Vite dev
  await page.route('**/api/admin/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  )
  // específicas después (LIFO: prioridad más alta)
  await page.route('**/api/admin/productos', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([PRODUCTO_MOCK]) })
  )
  await page.route('**/api/admin/ventas', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    } else {
      route.continue()
    }
  })
}

test.describe('Admin — Ventas', () => {
  test('pagina de ventas carga correctamente',
    { tag: ['@critical', '@e2e', '@ventas', '@VENTAS-E2E-001'] },
    async ({ page }) => {
      await setup(page)
      const ventas = new VentasPage(page)
      await ventas.goto()

      await expect(page.getByRole('heading', { name: /ventas/i })).toBeVisible()
      await expect(ventas.registrarBtn).toBeVisible()
    }
  )

  test('error de stock insuficiente muestra toast',
    { tag: ['@critical', '@e2e', '@ventas', '@VENTAS-E2E-002'] },
    async ({ page }) => {
      await setup(page)
      await page.route('**/api/admin/ventas', (route) => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Stock insuficiente para "Empanada de carne": disponible 2, requerido 10' }),
          })
        } else {
          route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
        }
      })

      const ventas = new VentasPage(page)
      await ventas.goto()
      await ventas.openForm()
      await ventas.selectProducto('Empanada de carne')
      await ventas.setCantidad(10)
      await ventas.submitForm()

      await expect(page.getByText(/stock insuficiente/i)).toBeVisible()
    }
  )

  test('formulario muestra campo de fecha con valor de hoy por defecto',
    { tag: ['@high', '@e2e', '@ventas', '@VENTAS-E2E-003'] },
    async ({ page }) => {
      await setup(page)
      const ventas = new VentasPage(page)
      await ventas.goto()
      await ventas.openForm()

      const today = new Date().toISOString().split('T')[0]
      await expect(page.getByLabel('Fecha', { exact: true })).toHaveValue(today)
    }
  )
})

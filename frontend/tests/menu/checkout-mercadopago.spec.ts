import { test, expect } from '@playwright/test'
import { MenuPage } from './menu-page'
import { mockCategoriasResponse } from '../helpers'

test.describe('Checkout Mercado Pago', () => {
  test.beforeEach(async ({ page }) => {
    await mockCategoriasResponse(page)
    await page.route('**/api/banner', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ activo: false }) })
    )
  })

  test('seleccionar Mercado Pago llama a /api/checkout/mercadopago y redirige',
    { tag: ['@critical', '@e2e', '@checkout', '@CHECKOUT-E2E-001'] },
    async ({ page }) => {
      await page.route('**/api/checkout/mercadopago', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ initPoint: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=test' }),
        })
      })

      const menu = new MenuPage(page)
      await menu.goto()
      await menu.agregarProducto('Empanada de carne')
      await menu.openCarrito()

      await page.getByRole('button', { name: 'Confirmar pedido' }).click()
      await page.getByText('Continuar con mis datos').click()

      await page.getByPlaceholder('María González').fill('Test Usuario')
      await page.getByPlaceholder('11 1234-5678').fill('1122334455')
      await page.getByPlaceholder('Av. Corrientes 1234, CABA').fill('Calle Falsa 123')

      await page.getByText('Selecciona una fecha').click()
      await page.locator('button[aria-label^="Seleccionar"]').first().click()

      await page.getByText('Mercado Pago').click()

      const [request] = await Promise.all([
        page.waitForRequest('**/api/checkout/mercadopago'),
        page.getByRole('button', { name: 'Pagar con Mercado Pago' }).click(),
      ])

      expect(request.method()).toBe('POST')
    }
  )
})

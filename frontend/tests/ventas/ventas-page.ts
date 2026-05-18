import { Page, Locator } from '@playwright/test'
import { BasePage } from '../base-page'

export class VentasPage extends BasePage {
  readonly registrarBtn: Locator

  constructor(page: Page) {
    super(page)
    this.registrarBtn = page.getByRole('button', { name: /registrar venta/i })
  }

  async goto(): Promise<void> {
    await super.goto('/admin/ventas')
  }

  async openForm(): Promise<void> {
    await this.registrarBtn.click()
  }

  async selectProducto(nombre: string): Promise<void> {
    await this.page.getByRole('combobox').first().selectOption({ label: nombre })
  }

  async setCantidad(cantidad: number): Promise<void> {
    const input = this.page.getByPlaceholder('Cant.').first()
    await input.fill(String(cantidad))
  }

  async submitForm(): Promise<void> {
    await this.page.getByRole('button', { name: /registrar venta/i }).last().click()
  }
}

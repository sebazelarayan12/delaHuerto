import { Page, Locator } from '@playwright/test'
import { BasePage } from '../base-page'

export class MenuPage extends BasePage {
  readonly cartFab: Locator

  constructor(page: Page) {
    super(page)
    this.cartFab = page.getByRole('button', { name: 'Ver carrito' })
  }

  async goto(): Promise<void> {
    await super.goto('/')
  }

  async getProductCard(nombre: string): Promise<Locator> {
    return this.page.locator('.rounded-2xl').filter({ hasText: nombre })
  }

  async agregarProducto(nombre: string): Promise<void> {
    const card = await this.getProductCard(nombre)
    await card.getByRole('button', { name: /agregar/i }).click()
  }

  async openCarrito(): Promise<void> {
    await this.page.getByRole('button', { name: 'Ver carrito' }).click()
  }
}

import { Page, Locator } from '@playwright/test'
import { BasePage } from '../base-page'

export class StockPage extends BasePage {
  readonly heading: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: /stock/i })
  }

  async goto(): Promise<void> {
    await super.goto('/admin/stock')
  }

  async openAjusteModal(productoNombre: string): Promise<void> {
    const row = this.page.getByRole('row').filter({ hasText: productoNombre })
    await row.getByRole('button', { name: /ajustar/i }).click()
  }
}

import { Page } from '@playwright/test'

export class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string): Promise<void> {
    await this.page.goto(path)
    await this.page.waitForLoadState('load')
    await this.page.waitForSelector('#root > *', { state: 'attached', timeout: 10000 })
  }

  async setAdminToken(token: string): Promise<void> {
    await this.page.addInitScript((t) => {
      localStorage.setItem('empanadas_admin_token', t)
    }, token)
  }
}

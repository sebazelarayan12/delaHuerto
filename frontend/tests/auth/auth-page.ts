import { Page, Locator } from '@playwright/test'
import { BasePage } from '../base-page'

export class AuthPage extends BasePage {
  readonly usernameInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator

  constructor(page: Page) {
    super(page)
    this.usernameInput = page.getByLabel('Usuario', { exact: true })
    this.passwordInput = page.getByLabel('Contrasena', { exact: true })
    this.submitButton = page.getByRole('button', { name: 'Ingresar' })
  }

  async goto(): Promise<void> {
    await super.goto('/admin/login')
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }
}

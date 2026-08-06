import { Page, Locator } from '@playwright/test'
import { BasePage } from '../base-page'

export class PedidosPage extends BasePage {
  readonly heading: Locator
  readonly newPedidoBtn: Locator
  readonly emptyActivos: Locator
  readonly busquedaHistorialInput: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: /pedidos/i })
    this.newPedidoBtn = page.getByRole('button', { name: /nuevo pedido/i })
    this.emptyActivos = page.getByText('No hay pedidos activos')
    this.busquedaHistorialInput = page.getByPlaceholder('Buscar por nombre o telefono...')
  }

  async goto(): Promise<void> {
    await super.goto('/admin/pedidos')
  }

  async toggleHistorial(): Promise<void> {
    await this.page.getByRole('button', { name: /historial/i }).click()
  }

  async clickFiltro(label: 'Por pagar' | 'Por entregar'): Promise<void> {
    const nombreAccesible = label === 'Por pagar' ? /pendientes por pagar/i : /pendientes por entregar/i
    await this.page.getByRole('button', { name: nombreAccesible }).click()
  }

  async buscarEnHistorial(texto: string): Promise<void> {
    await this.busquedaHistorialInput.fill(texto)
  }
}

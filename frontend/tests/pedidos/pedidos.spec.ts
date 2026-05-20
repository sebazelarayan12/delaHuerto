import { test, expect } from '@playwright/test'
import { PedidosPage } from './pedidos-page'
import { FAKE_JWT } from '../helpers'

const ITEM_BASE = {
  id: 1,
  productoId: 1,
  cantidad: 2,
  precioUnitario: '350.00',
  producto: { id: 1, nombre: 'Empanada de carne', fotoUrl: null },
}

const PEDIDO_PENDIENTE = {
  id: 1,
  estado: 'pendiente',
  nombre: 'Juan Garcia',
  telefono: null,
  direccion: null,
  notas: null,
  fechaEntrega: '2099-01-10T00:00:00.000Z',
  total: '700.00',
  ventaId: null,
  creadoEn: '2099-01-01T10:00:00.000Z',
  items: [{ ...ITEM_BASE }],
}

const PEDIDO_POR_ENTREGAR = {
  id: 2,
  estado: 'por_entregar',
  nombre: 'Maria Lopez',
  telefono: null,
  direccion: null,
  notas: null,
  fechaEntrega: '2099-01-20T00:00:00.000Z',
  total: '350.00',
  ventaId: 1,
  creadoEn: '2099-01-01T09:00:00.000Z',
  items: [{ ...ITEM_BASE, id: 2, cantidad: 1 }],
}

const PEDIDO_ENTREGADO = {
  id: 3,
  estado: 'entregado',
  nombre: 'Carlos Perez',
  telefono: null,
  direccion: null,
  notas: null,
  fechaEntrega: '2098-12-25T00:00:00.000Z',
  total: '350.00',
  ventaId: 2,
  creadoEn: '2098-12-20T08:00:00.000Z',
  items: [{ ...ITEM_BASE, id: 3, cantidad: 1 }],
}

async function setup(
  page: import('@playwright/test').Page,
  pedidos: unknown[] = []
) {
  await page.addInitScript((jwt) => {
    localStorage.setItem('empanadas_admin_token', jwt)
  }, FAKE_JWT)

  // catch-all primero (LIFO: prioridad mas baja)
  await page.route('**/api/admin/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  )
  // especifica despues (LIFO: prioridad mas alta)
  await page.route('**/api/admin/pedidos', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(pedidos),
    })
  )
}

test.describe('Admin — Pedidos', () => {
  test('pagina carga con heading y boton Nuevo pedido',
    { tag: ['@critical', '@e2e', '@pedidos', '@PEDIDOS-E2E-001'] },
    async ({ page }) => {
      await setup(page)
      const pedidos = new PedidosPage(page)
      await pedidos.goto()

      await expect(pedidos.heading).toBeVisible()
      await expect(pedidos.newPedidoBtn).toBeVisible()
    }
  )

  test('sin activos muestra estado vacio',
    { tag: ['@critical', '@e2e', '@pedidos', '@PEDIDOS-E2E-002'] },
    async ({ page }) => {
      await setup(page)
      const pedidos = new PedidosPage(page)
      await pedidos.goto()

      await expect(pedidos.emptyActivos).toBeVisible()
    }
  )

  test('aviso por pagar visible cuando hay pedidos pendientes',
    { tag: ['@critical', '@e2e', '@pedidos', '@PEDIDOS-E2E-003'] },
    async ({ page }) => {
      await setup(page, [PEDIDO_PENDIENTE])
      const pedidos = new PedidosPage(page)
      await pedidos.goto()

      await expect(page.getByText('Pendientes por pagar')).toBeVisible()
    }
  )

  test('aviso por entregar visible cuando hay pedidos por_entregar',
    { tag: ['@critical', '@e2e', '@pedidos', '@PEDIDOS-E2E-004'] },
    async ({ page }) => {
      await setup(page, [PEDIDO_POR_ENTREGAR])
      const pedidos = new PedidosPage(page)
      await pedidos.goto()

      await expect(page.getByText('Pendientes por entregar')).toBeVisible()
    }
  )

  test('aviso no visible cuando no hay pendientes ni por_entregar',
    { tag: ['@high', '@e2e', '@pedidos', '@PEDIDOS-E2E-005'] },
    async ({ page }) => {
      await setup(page, [PEDIDO_ENTREGADO])
      const pedidos = new PedidosPage(page)
      await pedidos.goto()

      await expect(page.getByText('Pendientes por pagar')).not.toBeVisible()
      await expect(page.getByText('Pendientes por entregar')).not.toBeVisible()
    }
  )

  test('activos ordenados por fecha de entrega mas proxima primero',
    { tag: ['@high', '@e2e', '@pedidos', '@PEDIDOS-E2E-006'] },
    async ({ page }) => {
      const pedidoProximo = {
        ...PEDIDO_PENDIENTE,
        id: 10,
        nombre: 'Ana Proxima',
        fechaEntrega: '2099-01-01T00:00:00.000Z',
      }
      const pedidoLejano = {
        ...PEDIDO_PENDIENTE,
        id: 11,
        nombre: 'Pedro Lejano',
        fechaEntrega: '2099-06-01T00:00:00.000Z',
      }
      // lejano primero en el array para verificar que el sort del frontend funciona
      await setup(page, [pedidoLejano, pedidoProximo])
      const pedidos = new PedidosPage(page)
      await pedidos.goto()

      const bodyText = await page.locator('body').textContent()
      const anaIdx = bodyText!.indexOf('Ana Proxima')
      const pedroIdx = bodyText!.indexOf('Pedro Lejano')
      expect(anaIdx).toBeGreaterThan(-1)
      expect(anaIdx).toBeLessThan(pedroIdx)
    }
  )

  test('toggle historial muestra pedidos completados',
    { tag: ['@high', '@e2e', '@pedidos', '@PEDIDOS-E2E-007'] },
    async ({ page }) => {
      await setup(page, [PEDIDO_ENTREGADO])
      const pedidos = new PedidosPage(page)
      await pedidos.goto()

      await expect(page.getByText('Carlos Perez')).not.toBeVisible()
      await pedidos.toggleHistorial()
      await expect(page.getByText('Carlos Perez')).toBeVisible()
    }
  )

  test('filtro Por pagar muestra solo pedidos pendientes',
    { tag: ['@high', '@e2e', '@pedidos', '@PEDIDOS-E2E-008'] },
    async ({ page }) => {
      await setup(page, [PEDIDO_PENDIENTE, PEDIDO_POR_ENTREGAR])
      const pedidos = new PedidosPage(page)
      await pedidos.goto()

      await pedidos.clickFiltro('Por pagar')

      await expect(page.getByText('Juan Garcia')).toBeVisible()
      await expect(page.getByText('Maria Lopez')).not.toBeVisible()
    }
  )

  test('filtro Por entregar muestra solo pedidos por_entregar',
    { tag: ['@high', '@e2e', '@pedidos', '@PEDIDOS-E2E-009'] },
    async ({ page }) => {
      await setup(page, [PEDIDO_PENDIENTE, PEDIDO_POR_ENTREGAR])
      const pedidos = new PedidosPage(page)
      await pedidos.goto()

      await pedidos.clickFiltro('Por entregar')

      await expect(page.getByText('Maria Lopez')).toBeVisible()
      await expect(page.getByText('Juan Garcia')).not.toBeVisible()
    }
  )

  test('filtro sin resultados muestra mensaje',
    { tag: ['@high', '@e2e', '@pedidos', '@PEDIDOS-E2E-010'] },
    async ({ page }) => {
      await setup(page, [PEDIDO_PENDIENTE])
      const pedidos = new PedidosPage(page)
      await pedidos.goto()

      await pedidos.clickFiltro('Por entregar')

      await expect(page.getByText('No hay pedidos con ese filtro')).toBeVisible()
    }
  )

  test('busqueda en historial filtra por nombre',
    { tag: ['@high', '@e2e', '@pedidos', '@PEDIDOS-E2E-011'] },
    async ({ page }) => {
      const pedidoExtra = {
        ...PEDIDO_ENTREGADO,
        id: 4,
        nombre: 'Roberto Silva',
      }
      await setup(page, [PEDIDO_ENTREGADO, pedidoExtra])
      const pedidos = new PedidosPage(page)
      await pedidos.goto()
      await pedidos.toggleHistorial()

      await pedidos.buscarEnHistorial('Roberto')

      await expect(page.getByText('Roberto Silva')).toBeVisible()
      await expect(page.getByText('Carlos Perez')).not.toBeVisible()
    }
  )

  test('busqueda sin resultados muestra mensaje',
    { tag: ['@high', '@e2e', '@pedidos', '@PEDIDOS-E2E-012'] },
    async ({ page }) => {
      await setup(page, [PEDIDO_ENTREGADO])
      const pedidos = new PedidosPage(page)
      await pedidos.goto()
      await pedidos.toggleHistorial()

      await pedidos.buscarEnHistorial('nombre que no existe xyz')

      await expect(page.getByText('No se encontraron pedidos')).toBeVisible()
    }
  )

  test('paginacion aparece con mas de 10 pedidos en historial',
    { tag: ['@high', '@e2e', '@pedidos', '@PEDIDOS-E2E-013'] },
    async ({ page }) => {
      const historialGrande = Array.from({ length: 11 }, (_, i) => ({
        ...PEDIDO_ENTREGADO,
        id: 100 + i,
        nombre: `Historico ${i + 1}`,
        creadoEn: new Date(2098, 11, 20 - i).toISOString(),
      }))
      await setup(page, historialGrande)
      const pedidos = new PedidosPage(page)
      await pedidos.goto()
      await pedidos.toggleHistorial()

      // controles de paginacion visibles (hay 2 paginas)
      await expect(page.getByRole('button', { name: '2', exact: true })).toBeVisible()

      // navegar a pagina 2 muestra el item 11
      await page.getByRole('button', { name: '2', exact: true }).click()
      await expect(page.getByText('Historico 11', { exact: true })).toBeVisible()
    }
  )
})

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { PedidosService } from '../services/pedidos.service.js'

const admin = new Hono()
admin.use('/*', authMiddleware)

const itemPedidoSchema = z.object({
  productoId: z.number().int().positive(),
  cantidad: z.number().int().positive(),
  precioUnitario: z.number().positive(),
})

const createPedidoSchema = z.object({
  nombre: z.string().min(1),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  notas: z.string().optional(),
  fechaEntrega: z.string().optional(),
  items: z.array(itemPedidoSchema).min(1),
})

const cambiarEstadoSchema = z.object({
  estado: z.enum(['por_entregar', 'entregado', 'cancelado']),
})

admin.get('/', async (c) => {
  const pedidos = await PedidosService.getPedidos()
  return c.json(pedidos)
})

admin.post('/', zValidator('json', createPedidoSchema), async (c) => {
  const data = c.req.valid('json')
  console.log('[POST] /api/admin/pedidos - nuevo pedido para:', data.nombre)
  const pedido = await PedidosService.createPedido(data)
  return c.json(pedido, 201)
})

admin.patch('/:id/estado', zValidator('json', cambiarEstadoSchema), async (c) => {
  const id = parseInt(c.req.param('id'))
  const { estado } = c.req.valid('json')
  console.log(`[PATCH] /api/admin/pedidos/${id}/estado - nuevo estado: ${estado}`)
  const pedido = await PedidosService.cambiarEstado(id, estado)
  return c.json(pedido)
})

admin.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  console.log(`[DELETE] /api/admin/pedidos/${id}`)
  await PedidosService.deletePedido(id)
  return c.json({ ok: true })
})

export { admin as pedidosAdminRoutes }

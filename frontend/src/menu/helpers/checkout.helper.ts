import { api } from '../../api/axios'
import type { ItemCarrito } from '../hooks/useCarrito'

interface DatosCheckout {
  readonly nombre: string
  readonly telefono: string
  readonly direccion: string
  readonly notas?: string
  readonly fechaEntrega: string
}

export async function crearPreferenceMercadoPago(items: ItemCarrito[], datos: DatosCheckout): Promise<string> {
  const { data } = await api.post<{ initPoint: string }>('/api/checkout/mercadopago', {
    nombre: datos.nombre,
    telefono: datos.telefono,
    direccion: datos.direccion,
    notas: datos.notas,
    fechaEntrega: datos.fechaEntrega,
    items: items.map((item) => ({ productoId: item.productoId, cantidad: item.cantidad })),
  })
  return data.initPoint
}

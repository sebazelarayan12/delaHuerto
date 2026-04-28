import type { Categoria, Producto } from '@prisma/client'

export class DtoMapper {
  static toProductoDTO(producto: Producto & { categoria?: Categoria }) {
    const { fotoPublicId, creadoEn, ...rest } = producto
    return rest
  }

  static toCategoriaDTO(categoria: Categoria & { productos?: Producto[] }) {
    const { creadaEn, ...rest } = categoria
    if (rest.productos) {
      return {
        ...rest,
        productos: rest.productos.map(DtoMapper.toProductoDTO)
      }
    }
    return rest
  }
}

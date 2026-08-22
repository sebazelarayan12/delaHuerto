import type { Categoria, Producto, DescuentoCategoria, CategoriaEgreso, Egreso } from '@prisma/client'

export class DtoMapper {
  static toProductoDTO(producto: Producto & { categoria?: Categoria }) {
    const { fotoPublicId, creadoEn, ...rest } = producto
    return rest
  }

  static toDescuentoDTO(descuento: DescuentoCategoria) {
    const { categoriaId, ...rest } = descuento
    return rest
  }

  static toCategoriaDTO(
    categoria: Categoria & { productos?: Producto[]; descuentos?: DescuentoCategoria[] }
  ) {
    const { creadaEn, ...rest } = categoria
    return {
      ...rest,
      ...(rest.productos ? { productos: rest.productos.map(DtoMapper.toProductoDTO) } : {}),
      descuentos: (rest.descuentos ?? []).map(DtoMapper.toDescuentoDTO),
    }
  }

  static toCategoriaEgresoDTO(categoria: CategoriaEgreso) {
    const { eliminado, creadaEn, ...rest } = categoria
    return rest
  }

  static toEgresoDTO(egreso: Egreso & { categoria?: CategoriaEgreso }) {
    const { eliminado, creadoEn, ...rest } = egreso
    return {
      ...rest,
      ...(rest.categoria ? { categoria: DtoMapper.toCategoriaEgresoDTO(rest.categoria) } : {}),
    }
  }
}

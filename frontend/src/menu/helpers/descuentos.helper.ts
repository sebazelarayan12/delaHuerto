export interface DescuentoTier {
  id?: number
  cantidadMinima: number
  porcentaje: number
}

export function calcularDescuentoParaCantidad(
  cantidad: number,
  tiers: DescuentoTier[]
): number {
  if (!tiers.length || cantidad === 0) return 0
  const sorted = [...tiers].sort((a, b) => b.cantidadMinima - a.cantidadMinima)
  const aplicable = sorted.find((t) => cantidad >= t.cantidadMinima)
  return aplicable ? aplicable.porcentaje / 100 : 0
}

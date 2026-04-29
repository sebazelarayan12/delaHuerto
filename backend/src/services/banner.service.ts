import { prisma } from '../db.js'

const DEFAULT = {
  titulo: 'Descuento en compras por mayor!',
  linea1: '+5 unidades: 5% de descuento',
  linea2: '+10 unidades: 25% de descuento',
  activo: true,
}

export class BannerService {
  static async getBanner() {
    let banner = await prisma.banner.findFirst()
    if (!banner) {
      banner = await prisma.banner.create({ data: DEFAULT })
    }
    return banner
  }

  static async updateBanner(data: Partial<typeof DEFAULT>) {
    let banner = await prisma.banner.findFirst()
    if (!banner) {
      return prisma.banner.create({ data: { ...DEFAULT, ...data } })
    }
    return prisma.banner.update({ where: { id: banner.id }, data })
  }
}

import { prisma } from '../db.js'

export class DeliveryDiasService {
  static async getConfig() {
    const existing = await prisma.deliveryConfig.findFirst()
    if (existing) return existing
    return prisma.deliveryConfig.create({ data: {} })
  }

  static async updateDias(dias: boolean[]) {
    const config = await DeliveryDiasService.getConfig()
    return prisma.deliveryConfig.update({
      where: { id: config.id },
      data: { dias },
    })
  }
}

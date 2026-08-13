-- CreateEnum
CREATE TYPE "Modalidad" AS ENUM ('cocinada', 'congelada');

-- AlterTable
ALTER TABLE "items_pedido" ADD COLUMN     "modalidad" "Modalidad" NOT NULL DEFAULT 'cocinada';

-- AlterTable
ALTER TABLE "items_venta" ADD COLUMN     "modalidad" "Modalidad" NOT NULL DEFAULT 'cocinada';

-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "precio_congelada" DECIMAL(10,2);

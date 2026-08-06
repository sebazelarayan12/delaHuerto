-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('efectivo', 'transferencia', 'mercadopago');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('pendiente', 'pagado');

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN "metodo_pago" "MetodoPago" NOT NULL DEFAULT 'efectivo',
ADD COLUMN "estado_pago" "EstadoPago" NOT NULL DEFAULT 'pendiente',
ADD COLUMN "mp_payment_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_mp_payment_id_key" ON "pedidos"("mp_payment_id");

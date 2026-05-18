-- AlterTable
ALTER TABLE "productos" ADD COLUMN "stock" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "productos" ADD COLUMN "stock_minimo" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ventas" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total" DECIMAL(10,2) NOT NULL,
    "notas" TEXT,
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_venta" (
    "id" SERIAL NOT NULL,
    "venta_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "items_venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ajustes_stock" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ajustes_stock_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "items_venta" ADD CONSTRAINT "items_venta_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_venta" ADD CONSTRAINT "items_venta_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ajustes_stock" ADD CONSTRAINT "ajustes_stock_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

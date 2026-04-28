-- CreateTable
CREATE TABLE "descuentos_categoria" (
    "id" SERIAL NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "cantidad_minima" INTEGER NOT NULL,
    "porcentaje" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "descuentos_categoria_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "descuentos_categoria" ADD CONSTRAINT "descuentos_categoria_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

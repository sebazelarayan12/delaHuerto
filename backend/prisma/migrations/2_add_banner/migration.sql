-- CreateTable
CREATE TABLE "banner" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL DEFAULT 'Descuento en compras por mayor!',
    "linea1" TEXT NOT NULL DEFAULT '+5 unidades: 5% de descuento',
    "linea2" TEXT NOT NULL DEFAULT '+10 unidades: 25% de descuento',
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "banner_pkey" PRIMARY KEY ("id")
);

-- Seed default row
INSERT INTO "banner" ("titulo", "linea1", "linea2", "activo")
VALUES ('Descuento en compras por mayor!', '+5 unidades: 5% de descuento', '+10 unidades: 25% de descuento', true);

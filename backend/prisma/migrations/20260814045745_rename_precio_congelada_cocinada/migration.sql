-- Rename puro de columnas, sin perdida de datos. El orden es obligatorio:
-- "precio_congelada" debe liberarse (paso 1) antes de que "precio" pueda
-- ocupar ese nombre (paso 2), o el segundo ALTER falla por colision.
ALTER TABLE "productos" RENAME COLUMN "precio_congelada" TO "precio_cocinada";
ALTER TABLE "productos" RENAME COLUMN "precio" TO "precio_congelada";

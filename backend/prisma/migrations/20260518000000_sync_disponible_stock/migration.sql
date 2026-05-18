-- Sync disponible with stock for existing products
-- Products created before stock tracking was added have stock=0 but disponible=true
UPDATE "productos"
SET    "disponible" = false
WHERE  "stock" <= 0
AND    "disponible" = true;

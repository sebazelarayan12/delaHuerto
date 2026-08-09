-- CreateTable
CREATE TABLE "delivery_config" (
    "id" SERIAL NOT NULL,
    "dias" BOOLEAN[] DEFAULT ARRAY[true, true, true, true, true, true, false]::BOOLEAN[],

    CONSTRAINT "delivery_config_pkey" PRIMARY KEY ("id")
);

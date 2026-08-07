-- CreateTable
CREATE TABLE "mercado_pago_connections" (
    "id" SERIAL NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "public_key" TEXT NOT NULL,
    "mp_user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "conectado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mercado_pago_connections_pkey" PRIMARY KEY ("id")
);

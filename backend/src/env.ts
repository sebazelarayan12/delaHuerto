import { config } from 'dotenv'
import { z } from 'zod'

export const modo = process.env.APP_ENV === 'development' ? 'development' : 'production'

config({ path: `.env.${modo}` })
config()

const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(32),
    ADMIN_USERNAME: z.string().min(1),
    ADMIN_PASSWORD: z.string().min(1),
    CLOUDINARY_CLOUD_NAME: z.string().min(1),
    CLOUDINARY_API_KEY: z.string().min(1),
    CLOUDINARY_API_SECRET: z.string().min(1),
    PORT: z.coerce.number().default(3000),
    ALLOWED_ORIGIN: z.string().default('http://localhost:5173'),
    VAPID_PUBLIC_KEY: z.string().min(1),
    VAPID_PRIVATE_KEY: z.string().min(1),
    VAPID_EMAIL: z.string().email(),
    MP_ACCESS_TOKEN: z.string().min(1),
    MP_PUBLIC_KEY: z.string().min(1),
    MP_CLIENT_ID: z.string().min(1),
    MP_CLIENT_SECRET: z.string().min(1),
    MP_WEBHOOK_SECRET: z.preprocess((v) => (v === '' ? undefined : v), z.string().min(1).optional()),
    FRONTEND_URL: z.string().min(1),
    BACKEND_URL: z.string().min(1),
  })
  .refine((data) => modo !== 'production' || !!data.MP_WEBHOOK_SECRET, {
    message: 'MP_WEBHOOK_SECRET es obligatoria en produccion (APP_ENV=production) para verificar la firma de los webhooks de Mercado Pago',
    path: ['MP_WEBHOOK_SECRET'],
  })

export const env = envSchema.parse(process.env)

# Huerto Empanadas — Sistema de pedidos por WhatsApp

Sistema web completo para una empanada casera: menú público para clientes y panel de administración para la dueña.

## Descripción

- **Menú público** (`/`): los clientes navegan el menú, agregan productos al carrito y envían el pedido por WhatsApp con un mensaje armado automáticamente.
- **Panel admin** (`/admin`): la dueña gestiona categorías y productos (crear, editar, activar/desactivar, subir fotos).

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + Hono + Prisma + PostgreSQL |
| Autenticación | JWT (jsonwebtoken) |
| Imágenes | Cloudinary |
| Frontend | React 19 + Vite + TypeScript |
| Estilos | Tailwind CSS v4 |
| State | TanStack Query v5 |
| Routing | React Router v7 |
| Formularios | React Hook Form v7 + Zod |

## Requisitos previos

- Node.js 20+
- PostgreSQL (local o remoto)
- Cuenta en Cloudinary (gratuita)

## Variables de entorno

### Backend (`backend/.env`)

Copiar `backend/.env.example` y completar:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/empanadas"
JWT_SECRET="un-secreto-largo-y-aleatorio"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="tu-contraseña"
CLOUDINARY_CLOUD_NAME="tu-cloud-name"
CLOUDINARY_API_KEY="tu-api-key"
CLOUDINARY_API_SECRET="tu-api-secret"
PORT=3000
ALLOWED_ORIGIN="http://localhost:5173"
```

### Frontend (`frontend/.env`)

Copiar `frontend/.env.example` y completar:

```env
VITE_API_URL="http://localhost:3000"
VITE_WHATSAPP_NUMBER="5493812345678"
```

El número de WhatsApp debe estar en formato internacional sin `+` (ej: `5493812345678` para Argentina).

## Instalación

### Backend

```bash
cd backend
npm install
npx prisma generate
```

### Frontend

```bash
cd frontend
npm install
```

## Desarrollo

### 1. Levantar la base de datos

Asegurate de tener PostgreSQL corriendo y el `DATABASE_URL` configurado.

### 2. Migraciones

```bash
cd backend
npm run db:migrate
```

### 3. Seed (datos de ejemplo)

```bash
cd backend
npm run db:seed
```

### 4. Correr backend

```bash
cd backend
npm run dev
```

El backend queda en `http://localhost:3000`.

### 5. Correr frontend

```bash
cd frontend
npm run dev
```

El frontend queda en `http://localhost:5173`.

## Flujo de verificación

1. Correr el seed → hay datos en la base
2. Abrir `http://localhost:5173` → se ven categorías y productos
3. Agregar productos → el carrito se actualiza
4. Completar formulario → se abre WhatsApp con el mensaje armado
5. Ir a `/admin/login` → hacer login con las credenciales del `.env`
6. Crear una nueva categoría → aparece en la lista
7. Crear un producto con foto → se sube a Cloudinary y aparece en el menú
8. Desactivar un producto → desaparece del menú público, sigue en el admin

## Estructura de carpetas

```
empanadas/
├── backend/
│   ├── src/
│   │   ├── index.ts          → Entry point, Hono, rutas
│   │   ├── db.ts             → Cliente Prisma singleton
│   │   ├── env.ts            → Variables de entorno (Zod)
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── categorias.routes.ts
│   │   │   └── productos.routes.ts
│   │   └── lib/
│   │       └── cloudinary.ts
│   └── prisma/
│       ├── schema.prisma
│       └── seed.ts
│
└── frontend/
    └── src/
        ├── App.tsx
        ├── api/axios.ts
        ├── config/env.ts
        ├── menu/             → Menú público
        │   ├── MenuPage.tsx
        │   ├── components/
        │   ├── hooks/
        │   └── helpers/
        ├── admin/            → Panel de administración
        │   ├── LoginPage.tsx
        │   ├── DashboardPage.tsx
        │   ├── AdminLayout.tsx
        │   ├── categorias/
        │   └── productos/
        └── shared/
            ├── components/
            └── hooks/
```

## Deploy

### Backend → Railway

1. Crear un proyecto en Railway
2. Agregar un servicio PostgreSQL
3. Agregar un servicio Node.js conectado al repositorio
4. Configurar las variables de entorno (igual que `.env.example`)
5. Railway detecta automáticamente el `package.json` y corre `npm start`
6. Ejecutar las migraciones desde la consola de Railway: `npx prisma migrate deploy`

### Frontend → Cloudflare Pages

1. Conectar el repositorio en Cloudflare Pages
2. Build command: `npm run build`
3. Build output directory: `dist`
4. Configurar `VITE_API_URL` con la URL del backend en Railway
5. Configurar `VITE_WHATSAPP_NUMBER` con el número de WhatsApp

### Imágenes → Cloudinary

Las imágenes se suben automáticamente a Cloudinary al crear/editar productos. Se requiere cuenta gratuita en cloudinary.com.

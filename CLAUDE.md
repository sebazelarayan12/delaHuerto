# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Delegation – MANDATORY

**Antes de comenzar cualquier tarea, determina el alcance y lee el CLAUDE.md correspondiente:**

| Alcance de la tarea | Accion requerida |
| --- | --- |
| Solo backend (rutas, Prisma, middleware, env, Cloudinary) | Leer `backend/CLAUDE.md` y seguir sus reglas |
| Solo frontend (componentes, hooks, estilos, queries) | Leer `frontend/CLAUDE.md` y seguir sus reglas |
| Full-stack (cambio de contrato API + actualizacion frontend) | Leer **ambos** CLAUDE.md; ejecutar backend primero, luego frontend |

**Este archivo es la autoridad global. Los CLAUDE.md de cada workspace agregan reglas especificas — nunca las contradicen.**

## Commands

### Backend (`cd backend`)
```bash
npm run dev          # tsx watch — hot reload
npm run build        # tsc → dist/
npm run start        # node dist/index.js

npm run db:migrate   # prisma migrate dev (creates migration + applies)
npm run db:generate  # prisma generate (after schema changes)
npm run db:seed      # seed de datos de ejemplo
npm run db:studio    # Prisma Studio en browser
```

### Frontend (`cd frontend`)
```bash
npm run dev          # Vite dev server → localhost:5173
npm run build        # tsc -b && vite build → dist/
npm run preview      # preview del build
```

No hay tests configurados.

## Architecture

Monorepo con dos workspaces independientes: `backend/` y `frontend/`. No comparten código ni `node_modules`.

### Backend

**Entry point**: `src/index.ts` — instancia Hono, registra middlewares (logger, CORS) y monta las rutas.

**Route split**: cada archivo en `src/routes/` exporta dos objetos Hono separados:
- `categoriasPublicRoutes` → montado en `/api/categorias` (sin auth)
- `categoriasAdminRoutes` → montado en `/api/admin/categorias` (con `authMiddleware`)
- `productosAdminRoutes` → montado en `/api/admin/productos` (con `authMiddleware`)

**Auth**: no hay tabla de usuarios. El login compara contra `ADMIN_USERNAME`/`ADMIN_PASSWORD` del `.env` y devuelve un JWT de 7 días. `auth.middleware.ts` verifica el token en cada ruta admin.

**Imágenes**: los endpoints de productos reciben `multipart/form-data` via `c.req.formData()`. `src/lib/cloudinary.ts` expone `uploadImage(buffer)` y `deleteImage(publicId)`. Al actualizar un producto con foto nueva, primero se borra la imagen anterior usando el `fotoPublicId` guardado en la BD.

**Env validation**: `src/env.ts` valida todas las variables con Zod al arrancar. Si falta alguna, el proceso falla con un mensaje claro antes de iniciar el servidor.

**DB**: `src/db.ts` es un singleton de PrismaClient. El schema tiene dos modelos: `Categoria` y `Producto` (relación 1-N). Soft delete: desactivar = `activa: false` / `disponible: false`.

### Frontend

**Routing** (`src/App.tsx`): React Router v7 con estas rutas:
- `/` → `MenuPage`
- `/admin/login` → `LoginPage`
- `/admin`, `/admin/categorias`, `/admin/productos` → wrapeadas en `ProtectedRoute`

**Auth state**: `useAuth` en `shared/hooks/` maneja login/logout. El token JWT se guarda en `localStorage` bajo la key `empanadas_admin_token`. `ProtectedRoute` lee directamente `localStorage` (no hay contexto global). El axios interceptor en `src/api/axios.ts` adjunta el token a cada request automáticamente.

**Server state**: TanStack Query v5. Query keys por dominio:
- `['categorias']` — menú público
- `['categorias', 'admin']` — panel admin
- `['productos', 'admin']` — panel admin

Todas las mutaciones llaman `invalidateQueries` en `onSuccess`.

**Carrito**: estado local en `useCarrito` (hook con `useState`). No persiste. Operaciones: `agregar`, `incrementar`, `decrementar`, `eliminar`, `vaciar`.

**Módulos feature**:
- `src/menu/` — menú público completo (hooks, components, helpers)
- `src/admin/categorias/` y `src/admin/productos/` — CRUD del panel, cada uno con su propio hook de TanStack Query
- `src/shared/` — `ProtectedRoute`, `ImageUpload`, `useAuth`

**Estilos**: Tailwind CSS v4 con `@tailwindcss/vite`. Los tokens de diseño están definidos en `src/index.css` bajo `@theme`. Paleta principal: `--color-terra: #C4522A`, `--color-espresso: #2C1208`, `--color-cream: #FDF6EC`. La mayoría de los componentes usan inline styles con esos valores hardcodeados (no clases Tailwind) para mayor control visual.

**Formularios**: React Hook Form v7 + Zod via `@hookform/resolvers`. Los campos numéricos usan `z.coerce.number()`. Los formularios de productos usan `FormData` (no JSON) para soportar upload de archivo.

## Key conventions

- Imports del backend usan extensión `.js` explícita (requerido por ESM con `"moduleResolution": "bundler"`)
- Los precios se guardan como `Decimal` en Prisma y llegan al frontend como `string` — siempre hacer `parseFloat(producto.precio)` antes de operar
- `productoSchema` en el backend usa `z.preprocess` para el campo `disponible` porque llega como string desde FormData

## Skills disponibles

Invocar el skill correspondiente antes de trabajar en cada área:

| Acción | Skill |
| --- | --- |
| Componentes React, hooks, TanStack Query | `react-19` |
| Estilos Tailwind, layout responsive | `tailwind-4` |
| UI compleja, diseño de pantallas | `ui-ux-pro-max` |
| Tipos TypeScript, interfaces, generics | `typescript` |
| Schemas Zod, validaciones | `zod-4` |
| Testing E2E | `playwright` |
| State management (si se agrega Zustand) | `zustand-5` |

## Sincronización Backend↔Frontend

**CRÍTICO:** Cualquier cambio en las rutas o DTOs del backend exige actualizar el frontend en la misma tarea.

- Cambio en ruta backend → actualizar el archivo de API correspondiente en `frontend/src/api/`
- Cambio en shape de respuesta → actualizar los tipos TypeScript en el frontend
- Invalidar caches de TanStack Query en `onSuccess` de todas las mutaciones

### Workflow para cambios full-stack:
1. Modificar ruta/handler en backend
2. Actualizar tipos y llamadas en frontend
3. Verificar que `npm run build` pasa en ambos workspaces

## Regla global — Sin emojis

**PROHIBIDO usar emojis en cualquier parte del proyecto:** codigo, componentes, textos del UI, commits, comentarios, documentacion. Sin excepciones.

## Seguridad y buenas prácticas

- Mantener credenciales y datos sensibles fuera del repositorio — respetar `.gitignore` (`.env*`)
- Variables sensibles siempre via entorno, nunca hardcodeadas en código
- No commitear archivos `.env` con valores reales
- Antes de exponer en producción: endurecer CORS (lista blanca de orígenes, no wildcard con credentials)

## Git

- **NUNCA hacer `git push` a menos que el usuario lo pida explicitamente.** Hacer commits locales esta permitido, pero no pushear sin instruccion directa.
- Usar **conventional commits**: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`
- Describir el *por qué* del cambio, no solo el *qué*
- No mezclar cambios no relacionados en un mismo commit

## Checklist antes de terminar una tarea

### Backend:
- [ ] `npm run build` sin errores TypeScript
- [ ] Variables de entorno nuevas documentadas en `.env.example` si existe

### Frontend:
- [ ] `npm run build` sin errores
- [ ] Tipos alineados con los DTOs del backend si hubo cambios de contrato

### General:
- [ ] Nada sensible en los commits (`.env`, tokens, passwords)
- [ ] Cualquier configuración nueva está documentada aquí o en comentarios de código

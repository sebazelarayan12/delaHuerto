# CLAUDE.md – Backend

---

## 0. Regla global inamovible

**NUNCA escribas tildes en ninguna palabra ni mensaje, sin importar el contexto.**

Correcto: "creacion", "validacion", "autenticacion", "migracion", "configuracion".
Incorrecto: "creación", "validación", "autenticación", "migración", "configuración".

---

## 1. Empanadas API – AI Agent Ruleset

Este archivo gobierna el agente que trabaja dentro de `backend/`. Toda tarea de backend debe respetar estas reglas antes de modificar cualquier archivo.

### Skills de referencia

| Skill | Cuando invocarla |
| --- | --- |
| `typescript` | Tipos, interfaces, generics, strict mode |
| `zod-4` | Schemas de validacion (el proyecto usa Zod v3; aplica principios de la skill) |
| `security-review` | Revision de seguridad antes de exponer endpoints nuevos |
| `review` | Revision general de calidad de codigo |

---

## 2. Auto-invoke Skills

| Accion | Skill |
| --- | --- |
| Crear/editar rutas, handlers, middlewares | `typescript` |
| Disenar schemas de validacion con Zod | `zod-4` |
| Analizar seguridad de endpoints o auth | `security-review` |
| Revisar calidad de codigo antes de terminar | `review` |
| Agregar nuevas variables de entorno | `zod-4` + `typescript` |
| Modificar modelos Prisma | `typescript` |

---

## 3. Reglas criticas – No negociables

### Rutas (src/routes/)

- SIEMPRE exportar dos objetos Hono separados por archivo cuando haya rutas publicas y admin: `<recurso>PublicRoutes` y `<recurso>AdminRoutes`.
- SIEMPRE montar rutas admin bajo `/api/admin/<recurso>` con `authMiddleware` aplicado.
- NUNCA retornar entidades de Prisma directamente: mapear a un objeto plano antes de responder.
- SIEMPRE validar el body/params con `@hono/zod-validator` antes de procesar.
- SIEMPRE loggear operaciones de escritura (POST/PUT/DELETE) con descripcion breve.

### Middleware (src/middleware/)

- SIEMPRE usar `auth.middleware.ts` en todas las rutas bajo `/api/admin/`.
- NUNCA duplicar logica de verificacion JWT fuera de `auth.middleware.ts`.
- SIEMPRE propagar errores al nivel superior con respuestas JSON estandar `{ error: "mensaje" }`.

### Validacion

- SIEMPRE definir schemas Zod en el mismo archivo de ruta o en `src/lib/schemas/` si se reusan.
- SIEMPRE usar `z.coerce.number()` para campos numericos que llegan de FormData.
- SIEMPRE usar `z.preprocess` para campos booleanos que llegan como string desde FormData.
- NUNCA confiar en tipos inferidos de `req.body` sin validacion previa.

### Base de datos (Prisma)

- SIEMPRE usar el singleton `src/db.ts` — nunca instanciar `PrismaClient` en otro lugar.
- SIEMPRE crear una migracion al modificar `schema.prisma` — nunca editar la DB manualmente.
- NUNCA hacer queries raw sin justificacion; preferir el query builder de Prisma.
- Soft delete: usar `activa: false` para `Categoria` y `disponible: false` para `Producto`. NUNCA eliminar registros fisicamente desde la API.
- Los precios (`Decimal`) llegan como `string` en las respuestas JSON. SIEMPRE documentarlo en el tipo de respuesta.

### Imagenes (Cloudinary)

- SIEMPRE usar `uploadImage(buffer)` de `src/lib/cloudinary.ts` — nunca llamar al SDK directamente desde una ruta.
- SIEMPRE borrar la imagen anterior con `deleteImage(fotoPublicId)` antes de subir una nueva en actualizaciones.
- NUNCA guardar rutas locales de archivos — solo URLs y public IDs de Cloudinary.

### Variables de entorno

- SIEMPRE agregar variables nuevas al schema en `src/env.ts` con validacion Zod.
- SIEMPRE agregar la variable nueva a `.env.example` con un valor de ejemplo o placeholder.
- NUNCA acceder a `process.env` directamente fuera de `src/env.ts`.

### Autenticacion y seguridad

- NUNCA crear tabla de usuarios: la autenticacion compara contra `ADMIN_USERNAME`/`ADMIN_PASSWORD` del entorno.
- JWT tiene duracion de 7 dias. NUNCA cambiar esto sin revisar implicaciones de seguridad.
- CORS: en produccion restringir `origin` a dominios especificos. NUNCA usar `AllowAnyOrigin` con credenciales.
- NUNCA loggear passwords, tokens JWT ni API keys en ningun contexto.

---

## 4. Arboles de decision

### ¿Donde va la logica nueva?

```
¿Es validacion de input?
  └─ SI  → Schema Zod en la ruta (o src/lib/schemas/ si se reutiliza)
  └─ NO  → ¿Es logica de negocio reutilizable?
              └─ SI  → Funcion helper en src/lib/
              └─ NO  → Inline en el handler de la ruta
```

### ¿Necesito una migracion?

```
¿Cambie schema.prisma?
  └─ SI  → npm run db:migrate (crea migracion + aplica)
         → npm run db:generate (regenera cliente)
  └─ NO  → Solo npm run db:generate si cambie anotaciones sin afectar schema SQL
```

### ¿Como manejar una imagen en actualizacion de producto?

```
¿Llego nueva imagen en el request?
  └─ SI  → ¿El producto ya tenia fotoPublicId?
              └─ SI  → deleteImage(fotoPublicId) → uploadImage(nuevoBuffer) → guardar nueva URL y publicId
              └─ NO  → uploadImage(nuevoBuffer) → guardar URL y publicId
  └─ NO  → No tocar fotoUrl ni fotoPublicId existentes
```

---

## 5. Tech Stack

| Componente | Tecnologia |
| --- | --- |
| Runtime | Node.js (Bun-compatible via Hono) |
| Framework | Hono 4 |
| Lenguaje | TypeScript 5 (ESM strict) |
| ORM | Prisma 6 |
| Base de datos | PostgreSQL |
| Validacion | Zod 3 + @hono/zod-validator |
| Imagenes | Cloudinary SDK v2 |
| Auth | jsonwebtoken (JWT HS256) |
| Serializacion | JSON nativo de Hono |

---

## 6. Estructura del proyecto

```
backend/
├── prisma/
│   ├── schema.prisma        # Modelos Categoria y Producto
│   └── seed.ts              # Seed de datos de ejemplo
├── src/
│   ├── index.ts             # Entry point: Hono app, middlewares, mount de rutas
│   ├── env.ts               # Validacion de variables de entorno con Zod
│   ├── db.ts                # Singleton PrismaClient
│   ├── lib/
│   │   └── cloudinary.ts    # uploadImage(buffer) y deleteImage(publicId)
│   ├── middleware/
│   │   └── auth.middleware.ts   # Verifica JWT en rutas admin
│   └── routes/
│       ├── auth.routes.ts           # POST /api/auth/login
│       ├── categorias.routes.ts     # Public + Admin routes para Categoria
│       └── productos.routes.ts      # Admin routes para Producto
├── .env                     # Variables locales (NO commitear)
├── .env.example             # Plantilla de variables requeridas
├── package.json
└── tsconfig.json
```

### Modelos Prisma

**Categoria**: `id`, `nombre`, `orden`, `activa`, `creadaEn`, `productos[]`

**Producto**: `id`, `categoriaId`, `nombre`, `descripcion?`, `precio (Decimal)`, `precioUnidad?`, `fotoUrl?`, `fotoPublicId?`, `disponible`, `orden`, `creadoEn`

---

## 7. Comandos

### Desarrollo

```bash
npm run dev          # tsx watch src/index.ts — hot reload en localhost:3000
npm run build        # tsc → dist/
npm run start        # node dist/index.js (produccion)
```

### Base de datos

```bash
npm run db:migrate   # prisma migrate dev — crea y aplica migracion
npm run db:generate  # prisma generate — regenera cliente tras cambios de schema
npm run db:seed      # tsx prisma/seed.ts — carga datos de ejemplo
npm run db:studio    # Prisma Studio en browser
```

### Verificacion antes de mergear

```bash
npm run build        # Debe pasar sin errores TS
```

---

## 8. Checklist de QA antes de terminar una tarea

### Base de datos
- [ ] Si se modifico `schema.prisma`, migracion creada y aplicada (`npm run db:migrate`)
- [ ] Cliente Prisma regenerado (`npm run db:generate`)
- [ ] Migracion generada tiene nombre descriptivo

### Rutas y handlers
- [ ] Nuevas rutas admin tienen `authMiddleware` aplicado
- [ ] Todos los inputs validados con Zod antes de procesar
- [ ] Respuestas devuelven objetos planos, no entidades Prisma
- [ ] Operaciones de escritura tienen log descriptivo

### Imagenes
- [ ] Al actualizar producto con nueva imagen, imagen anterior borrada de Cloudinary
- [ ] `fotoPublicId` guardado correctamente en la BD

### Variables de entorno
- [ ] Variables nuevas agregadas al schema de `src/env.ts`
- [ ] Variables nuevas documentadas en `.env.example`

### Seguridad
- [ ] Sin valores sensibles hardcodeados (tokens, passwords, API keys)
- [ ] Sin archivos `.env` en commits
- [ ] CORS configurado correctamente para el ambiente objetivo

### General
- [ ] `npm run build` pasa sin errores
- [ ] Endpoint nuevo o modificado accesible y respondiendo correctamente

---

## 9. Convenciones de nombres

| Elemento | Patron | Ejemplo |
| --- | --- | --- |
| Archivo de ruta | `<recurso>.routes.ts` | `productos.routes.ts` |
| Export public routes | `<recurso>PublicRoutes` | `categoriasPublicRoutes` |
| Export admin routes | `<recurso>AdminRoutes` | `categoriasAdminRoutes` |
| Archivo de middleware | `<nombre>.middleware.ts` | `auth.middleware.ts` |
| Archivo de lib | `<nombre>.ts` (camelCase) | `cloudinary.ts` |
| Schema Zod | `<recurso>Schema` | `productoSchema` |
| Variables de entorno | `UPPER_SNAKE_CASE` | `CLOUDINARY_API_KEY` |
| Campos Prisma | `camelCase` en TS, `snake_case` en DB via `@map` | `categoriaId` → `categoria_id` |
| Tablas Prisma | `snake_case` plural via `@@map` | `@@map("productos")` |

### Imports ESM

SIEMPRE usar extension `.js` en imports relativos del backend:

```typescript
import { env } from './env.js'
import authRoutes from './routes/auth.routes.js'
```

---

## 10. Convenciones de API

### Rutas base

| Tipo | Prefijo | Proteccion |
| --- | --- | --- |
| Publicas | `/api/<recurso>` | Ninguna |
| Admin | `/api/admin/<recurso>` | JWT via `authMiddleware` |
| Auth | `/api/auth` | Ninguna |
| Health | `/health` | Ninguna |

### Codigos de respuesta

| Situacion | Codigo |
| --- | --- |
| GET exitoso | 200 |
| POST exitoso (creacion) | 201 |
| PUT/DELETE exitoso | 200 |
| No encontrado | 404 + `{ error: "mensaje" }` |
| No autorizado | 401 + `{ error: "No autorizado" }` |
| Error de validacion | 400 + detalle del error Zod |
| Error interno | 500 + `{ error: "Error interno" }` |

### Serializacion

- Fechas: ISO 8601 string (comportamiento default de Prisma/JSON.stringify)
- Decimales (precios): llegan al frontend como `string` — documentar siempre en el tipo de respuesta
- Booleanos desde FormData: usar `z.preprocess` para convertir `"true"`/`"false"` → `boolean`

### Ejemplo de respuesta de producto

```json
{
  "id": 1,
  "nombre": "Empanada de carne",
  "descripcion": "Con cebolla y huevo",
  "precio": "350.00",
  "precioUnidad": "40.00",
  "fotoUrl": "https://res.cloudinary.com/.../foto.jpg",
  "disponible": true,
  "orden": 1,
  "categoriaId": 2
}
```

### Paginacion y filtros (si se agregan en el futuro)

- Query params: `page`, `pageSize`, `search`
- Respuesta paginada: `{ data: [...], total: N, page: N, pageSize: N }`

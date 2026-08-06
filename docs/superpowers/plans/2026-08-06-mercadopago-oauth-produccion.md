# Mercado Pago OAuth para produccion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Conectar `api-prod` a la cuenta de Mercado Pago del cliente (no la del desarrollador) via OAuth, para que los pagos productivos se acrediten donde corresponde, sin que el cliente tenga que copiar credenciales a mano.

**Architecture:** Authorization Code flow con `scope=offline_access`. El admin dispara la autorizacion desde el panel, MP redirige de vuelta a un callback publico que intercambia el `code` por tokens y los guarda en una fila singleton (`MercadoPagoConnection`). Los servicios de checkout/webhook resuelven el token vigente en cada llamada en vez de usar un env var estatico. Un cron diario renueva el token antes de que venza y avisa por push notification si el refresh falla.

**Tech Stack:** Hono, Prisma/PostgreSQL, Zod, jsonwebtoken (ya en uso), `fetch` nativo de Node 20 para llamar a `/oauth/token` de MP (sin agregar dependencias nuevas), React 19 + TanStack Query en el frontend.

## Global Constraints

- Sin tildes en ningun texto, mensaje, log o commit (regla global del repo).
- El proyecto **no tiene test runner configurado** (ni backend ni frontend, salvo Playwright E2E). Los pasos de verificacion de este plan usan `npm run build` (chequeo de tipos) + verificacion manual (curl/browser), no tests unitarios — es la misma convencion que se uso en todo el resto de esta sesion.
- Nunca loggear ni devolver `accessToken`/`refreshToken` en respuestas de API.
- Imports relativos del backend con extension `.js` explicita (ESM).
- Rutas admin siempre con `authMiddleware`; nunca devolver entidades Prisma crudas en respuestas.
- Toda variable de entorno nueva va a `env.ts` (validada con Zod) y a `.env.example`.
- Esto solo afecta produccion. Development sigue usando `MP_ACCESS_TOKEN`/`MP_PUBLIC_KEY` estaticos sin cambios de comportamiento.
- `MP_CLIENT_ID`/`MP_CLIENT_SECRET` se consiguen con la tool `get_credentials` del MCP de Mercado Pago (AppID `3297872698083650`, app "delahuerto") — se cargan directo en Dokploy/`.env.development`, **nunca se escriben en un archivo commiteado**.

---

### Task 1: Modelo de datos `MercadoPagoConnection`

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/<timestamp>_add_mercadopago_connection/migration.sql` (generado por Prisma, no escribir a mano)

**Interfaces:**
- Produces: modelo Prisma `MercadoPagoConnection` con campos `id`, `accessToken`, `refreshToken`, `publicKey`, `mpUserId`, `expiresAt`, `conectadoEn`, `actualizadoEn`. Cliente Prisma expone `prisma.mercadoPagoConnection.findFirst()`, `.create()`, `.update()`.

- [ ] **Step 1: Agregar el modelo a `schema.prisma`**

Agregar al final de `backend/prisma/schema.prisma`:

```prisma
model MercadoPagoConnection {
  id            Int      @id @default(autoincrement())
  accessToken   String   @map("access_token")
  refreshToken  String   @map("refresh_token")
  publicKey     String   @map("public_key")
  mpUserId      String   @map("mp_user_id")
  expiresAt     DateTime @map("expires_at")
  conectadoEn   DateTime @default(now()) @map("conectado_en")
  actualizadoEn DateTime @updatedAt @map("actualizado_en")

  @@map("mercado_pago_connections")
}
```

- [ ] **Step 2: Generar y aplicar la migracion**

Run: `cd backend && npx prisma migrate dev --name add_mercadopago_connection`
Expected: crea `backend/prisma/migrations/<timestamp>_add_mercadopago_connection/migration.sql` con un `CREATE TABLE "mercado_pago_connections"`, la aplica contra la DB local, y regenera el cliente Prisma.

- [ ] **Step 3: Verificar que el cliente Prisma tiene el modelo nuevo**

Run: `cd backend && npx tsc --noEmit`
Expected: sin errores (confirma que `@prisma/client` genero los tipos).

- [ ] **Step 4: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations
git commit -m "feat(mercadopago): agregar modelo MercadoPagoConnection"
```

---

### Task 2: Variables de entorno `MP_CLIENT_ID` / `MP_CLIENT_SECRET`

**Files:**
- Modify: `backend/src/env.ts`
- Modify: `backend/.env.example`

**Interfaces:**
- Consumes: patron existente de `.refine()` en `env.ts` (ver `MP_WEBHOOK_SECRET`, agregado en una sesion anterior).
- Produces: `env.MP_CLIENT_ID: string`, `env.MP_CLIENT_SECRET: string` (ambas requeridas siempre — a diferencia de `MP_WEBHOOK_SECRET` que solo es obligatoria en produccion, estas identifican la app "delahuerto" del desarrollador y hacen falta tambien en development para poder probar el flujo OAuth).

- [ ] **Step 1: Agregar los campos al schema de `env.ts`**

En `backend/src/env.ts`, dentro del objeto pasado a `z.object({...})` (antes del `.refine(...)` existente), agregar junto a las demas variables de `MP_`:

```typescript
    MP_ACCESS_TOKEN: z.string().min(1),
    MP_PUBLIC_KEY: z.string().min(1),
    MP_CLIENT_ID: z.string().min(1),
    MP_CLIENT_SECRET: z.string().min(1),
    MP_WEBHOOK_SECRET: z.preprocess((v) => (v === '' ? undefined : v), z.string().min(1).optional()),
```

- [ ] **Step 2: Documentar en `.env.example`**

En `backend/.env.example`, agregar despues de `MP_PUBLIC_KEY=""`:

```
MP_CLIENT_ID=""
MP_CLIENT_SECRET=""
```

- [ ] **Step 3: Cargar los valores reales en `.env.development`**

Obtener `client_id`/`client_secret` de la app "delahuerto" con la tool `get_credentials` del MCP de Mercado Pago (`application_id: "3297872698083650"`) y pegarlos en `backend/.env.development` (no commiteado, ya en `.gitignore`).

- [ ] **Step 4: Verificar que el server arranca con las variables nuevas**

Run: `cd backend && npm run dev` (esperar el log `Server running on...`, despues `Ctrl+C`)
Expected: arranca sin el error de Zod `MP_CLIENT_ID: Required`.

- [ ] **Step 5: Commit**

```bash
git add backend/src/env.ts backend/.env.example
git commit -m "feat(mercadopago): agregar MP_CLIENT_ID y MP_CLIENT_SECRET al schema de env"
```

---

### Task 3: Resolucion dinamica del access token en `lib/mercadopago.ts`

**Files:**
- Modify: `backend/src/lib/mercadopago.ts`

**Interfaces:**
- Consumes: `prisma` (`../db.js`), `env`/`modo` (`../env.js`), modelo `MercadoPagoConnection` (Task 1).
- Produces: `getMpAccessToken(): Promise<string | null>`, `getMpPreferenceClient(): Promise<Preference | null>`, `getMpPaymentClient(): Promise<Payment | null>`. Reemplaza los exports estaticos `mpClient`/`mpPreference`/`mpPayment` que existian antes — cualquier archivo que los importaba se actualiza en la Task 7.

- [ ] **Step 1: Reescribir `lib/mercadopago.ts`**

Reemplazar todo el contenido de `backend/src/lib/mercadopago.ts` por:

```typescript
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'
import { prisma } from '../db.js'
import { env, modo } from '../env.js'

// Regla dura: en produccion, si no hay una cuenta de MP conectada via OAuth,
// JAMAS se usa el MP_ACCESS_TOKEN estatico (es del desarrollador, no del cliente)
// para crear preferencias ni consultar pagos. Devuelve null y quien llama debe
// cortar el flujo (503 en checkout, log + procesado:false en el webhook).
export async function getMpAccessToken(): Promise<string | null> {
  const connection = await prisma.mercadoPagoConnection.findFirst()
  if (connection) return connection.accessToken
  if (modo === 'production') return null
  return env.MP_ACCESS_TOKEN
}

export async function getMpPreferenceClient(): Promise<Preference | null> {
  const accessToken = await getMpAccessToken()
  if (!accessToken) return null
  return new Preference(new MercadoPagoConfig({ accessToken }))
}

export async function getMpPaymentClient(): Promise<Payment | null> {
  const accessToken = await getMpAccessToken()
  if (!accessToken) return null
  return new Payment(new MercadoPagoConfig({ accessToken }))
}
```

- [ ] **Step 2: Verificar tipos**

Run: `cd backend && npx tsc --noEmit`
Expected: fallan `checkout.service.ts` y `mercadopago-webhook.service.ts` porque todavia importan `mpPreference`/`mpPayment` (se corrige en Task 7) — esperado en este punto, no revertir.

- [ ] **Step 3: Commit**

```bash
git add backend/src/lib/mercadopago.ts
git commit -m "refactor(mercadopago): resolver el access token dinamicamente en vez de un cliente estatico"
```

---

### Task 4: `MercadoPagoOAuthService`

**Files:**
- Create: `backend/src/services/mercadopago-oauth.service.ts`

**Interfaces:**
- Consumes: `prisma` (`../db.js`), `env` (`../env.js`), `jsonwebtoken` (ya es dependencia del proyecto, usado en `auth.middleware.ts`).
- Produces: clase `MercadoPagoOAuthService` con metodos estaticos `signState()`, `verifyState(state: string): boolean`, `buildAuthorizationUrl(): string`, `exchangeCodeForToken(code: string): Promise<MpOAuthTokenResponse>`, `refreshToken(refreshToken: string): Promise<MpOAuthTokenResponse>`, `saveConnection(token: MpOAuthTokenResponse)`, `getConnection()`, `getStatus()`. Usado por Task 5 (rutas admin) y Task 6 (callback publico) y Task 9 (cron).

- [ ] **Step 1: Crear el servicio**

Crear `backend/src/services/mercadopago-oauth.service.ts`:

```typescript
import jwt from 'jsonwebtoken'
import { prisma } from '../db.js'
import { env } from '../env.js'

const MP_OAUTH_AUTHORIZE_URL = 'https://auth.mercadopago.com/authorization'
const MP_OAUTH_TOKEN_URL = 'https://api.mercadopago.com/oauth/token'
const CALLBACK_PATH = '/api/webhooks/mercadopago/oauth/callback'

interface MpOAuthTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
  user_id: number
  refresh_token: string
  public_key: string
  live_mode: boolean
}

export class MercadoPagoOAuthService {
  static signState(): string {
    return jwt.sign({ purpose: 'mp-oauth-state' }, env.JWT_SECRET, { expiresIn: '10m' })
  }

  static verifyState(state: string): boolean {
    try {
      const decoded = jwt.verify(state, env.JWT_SECRET) as jwt.JwtPayload
      return decoded.purpose === 'mp-oauth-state'
    } catch {
      return false
    }
  }

  static buildAuthorizationUrl(): string {
    const state = MercadoPagoOAuthService.signState()
    const redirectUri = `${env.BACKEND_URL}${CALLBACK_PATH}`
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: env.MP_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: 'offline_access',
      state,
    })
    return `${MP_OAUTH_AUTHORIZE_URL}?${params.toString()}`
  }

  static async exchangeCodeForToken(code: string): Promise<MpOAuthTokenResponse> {
    const redirectUri = `${env.BACKEND_URL}${CALLBACK_PATH}`
    const response = await fetch(MP_OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: env.MP_CLIENT_ID,
        client_secret: env.MP_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    })
    if (!response.ok) {
      const body = await response.text()
      throw new Error(`MP oauth/token (authorization_code) fallo: ${response.status} ${body}`)
    }
    return response.json() as Promise<MpOAuthTokenResponse>
  }

  static async refreshToken(refreshToken: string): Promise<MpOAuthTokenResponse> {
    const response = await fetch(MP_OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: env.MP_CLIENT_ID,
        client_secret: env.MP_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })
    if (!response.ok) {
      const body = await response.text()
      throw new Error(`MP oauth/token (refresh_token) fallo: ${response.status} ${body}`)
    }
    return response.json() as Promise<MpOAuthTokenResponse>
  }

  static async saveConnection(token: MpOAuthTokenResponse) {
    const expiresAt = new Date(Date.now() + token.expires_in * 1000)
    const existing = await prisma.mercadoPagoConnection.findFirst()
    const data = {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      publicKey: token.public_key,
      mpUserId: String(token.user_id),
      expiresAt,
    }
    if (existing) {
      return prisma.mercadoPagoConnection.update({ where: { id: existing.id }, data })
    }
    return prisma.mercadoPagoConnection.create({ data })
  }

  static async getConnection() {
    return prisma.mercadoPagoConnection.findFirst()
  }

  static async getStatus() {
    const connection = await MercadoPagoOAuthService.getConnection()
    if (!connection) return { connected: false as const }
    return {
      connected: true as const,
      mpUserId: connection.mpUserId,
      conectadoEn: connection.conectadoEn,
      expiresAt: connection.expiresAt,
    }
  }
}
```

- [ ] **Step 2: Verificar tipos**

Run: `cd backend && npx tsc --noEmit`
Expected: sin errores nuevos en este archivo (los errores de `checkout.service.ts`/`mercadopago-webhook.service.ts` de la Task 3 siguen, se resuelven en Task 7).

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/mercadopago-oauth.service.ts
git commit -m "feat(mercadopago): agregar MercadoPagoOAuthService (authorize, exchange, refresh, status)"
```

---

### Task 5: Rutas admin (`/api/admin/mercadopago`)

**Files:**
- Create: `backend/src/routes/mercadopago.routes.ts`
- Modify: `backend/src/index.ts`

**Interfaces:**
- Consumes: `authMiddleware` (`../middleware/auth.middleware.js`), `MercadoPagoOAuthService` (Task 4).
- Produces: `GET /api/admin/mercadopago/authorize` → `{ url: string }`. `GET /api/admin/mercadopago/status` → `{ connected: boolean, mpUserId?: string, conectadoEn?: string, expiresAt?: string }`. Consumido por el frontend en Task 10.

- [ ] **Step 1: Crear las rutas**

Crear `backend/src/routes/mercadopago.routes.ts`:

```typescript
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { MercadoPagoOAuthService } from '../services/mercadopago-oauth.service.js'

const admin = new Hono()
admin.use('/*', authMiddleware)

admin.get('/authorize', async (c) => {
  const url = MercadoPagoOAuthService.buildAuthorizationUrl()
  console.log('[GET] /api/admin/mercadopago/authorize')
  return c.json({ url })
})

admin.get('/status', async (c) => {
  const status = await MercadoPagoOAuthService.getStatus()
  return c.json(status)
})

export { admin as mercadopagoAdminRoutes }
```

- [ ] **Step 2: Montar la ruta en `index.ts`**

En `backend/src/index.ts`, agregar el import junto a los demas de `./routes/`:

```typescript
import { mercadopagoAdminRoutes } from './routes/mercadopago.routes.js'
```

Y agregar el `app.route(...)` junto a los demas admin, despues de la linea de `notificationsAdminRoutes`:

```typescript
app.route('/api/admin/mercadopago', mercadopagoAdminRoutes)
```

- [ ] **Step 3: Verificar manualmente que el endpoint responde**

Run: `cd backend && npm run dev` (dejar corriendo)

En otra terminal, loguearse para obtener un JWT:
```bash
curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"<ADMIN_USERNAME de tu .env.development>","password":"<ADMIN_PASSWORD>"}'
```
Copiar el `token` de la respuesta, y:
```bash
curl -s http://localhost:3000/api/admin/mercadopago/authorize -H "Authorization: Bearer <token>"
```
Expected: `{"url":"https://auth.mercadopago.com/authorization?response_type=code&client_id=...&redirect_uri=...&scope=offline_access&state=..."}`.

Cortar el server con `Ctrl+C`.

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/mercadopago.routes.ts backend/src/index.ts
git commit -m "feat(mercadopago): agregar rutas admin authorize y status"
```

---

### Task 6: Callback publico de OAuth

**Files:**
- Modify: `backend/src/routes/webhooks.routes.ts`

**Interfaces:**
- Consumes: `MercadoPagoOAuthService` (Task 4), `env` (ya importado en el archivo).
- Produces: `GET /api/webhooks/mercadopago/oauth/callback` (publica) — redirige el browser a `${FRONTEND_URL}/admin?mp=conectado` o `?mp=error`. Consumido por Task 10 (toast en el dashboard segun ese query param).

**IMPORTANTE — prerequisito manual antes de probar esta task:** la app "delahuerto" en el panel de Mercado Pago Developers necesita tener registrada la URL de redireccionamiento exacta en su seccion "Detalles de aplicacion" → "URLs de redireccionamiento". Para development: `http://localhost:3000/api/webhooks/mercadopago/oauth/callback`. Para produccion: `https://app-parse-optical-bandwidth-zu671w-ba0bc1-169-58-25-147.sslip.io/api/webhooks/mercadopago/oauth/callback`. Si no coincide exacto, MP devuelve un error en el paso de autorizacion. Esto no se puede automatizar por API, es un campo del panel web de MP.

- [ ] **Step 1: Agregar el import**

En `backend/src/routes/webhooks.routes.ts`, agregar junto a los demas imports:

```typescript
import { MercadoPagoOAuthService } from '../services/mercadopago-oauth.service.js'
```

- [ ] **Step 2: Agregar la ruta del callback**

Agregar antes de `export { publicRoutes as webhooksPublicRoutes }`:

```typescript
publicRoutes.get('/mercadopago/oauth/callback', async (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')

  if (!code || !state || !MercadoPagoOAuthService.verifyState(state)) {
    console.error('[GET] /api/webhooks/mercadopago/oauth/callback - state invalido o code faltante')
    return c.redirect(`${env.FRONTEND_URL}/admin?mp=error`)
  }

  try {
    const token = await MercadoPagoOAuthService.exchangeCodeForToken(code)
    await MercadoPagoOAuthService.saveConnection(token)
    console.log(`[GET] /api/webhooks/mercadopago/oauth/callback - conectado mpUserId ${token.user_id}`)
    return c.redirect(`${env.FRONTEND_URL}/admin?mp=conectado`)
  } catch (err) {
    console.error('[GET] /api/webhooks/mercadopago/oauth/callback - error intercambiando code:', err)
    return c.redirect(`${env.FRONTEND_URL}/admin?mp=error`)
  }
})
```

- [ ] **Step 3: Verificar tipos y arranque**

Run: `cd backend && npx tsc --noEmit && npm run build`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/webhooks.routes.ts
git commit -m "feat(mercadopago): agregar callback publico de OAuth"
```

---

### Task 7: Usar el token dinamico en checkout y webhook de pagos

**Files:**
- Modify: `backend/src/services/checkout.service.ts`
- Modify: `backend/src/services/mercadopago-webhook.service.ts`

**Interfaces:**
- Consumes: `getMpPreferenceClient()`, `getMpPaymentClient()` (Task 3).
- Produces: `CheckoutService.crearPreference` tira `HttpError(503, ...)` si no hay token disponible en produccion. `MercadoPagoWebhookService.procesarNotificacion` devuelve `{ procesado: false }` (con log critico) si no hay token disponible, en vez de crashear.

- [ ] **Step 1: Actualizar `checkout.service.ts`**

En `backend/src/services/checkout.service.ts`, cambiar el import:

```typescript
import { getMpPreferenceClient } from '../lib/mercadopago.js'
```

Y dentro de `crearPreference`, reemplazar el bloque final (`const result = await mpPreference.create(...)`) por:

```typescript
    const mpPreference = await getMpPreferenceClient()
    if (!mpPreference) {
      throw new HttpError(503, 'Pago no disponible, contactar al administrador')
    }

    const result = await mpPreference.create({
      body: {
        items: mpItems,
        metadata,
        back_urls: {
          success: `${env.FRONTEND_URL}/pedido/exito`,
          failure: `${env.FRONTEND_URL}/pedido/error`,
          pending: `${env.FRONTEND_URL}/pedido/pendiente`,
        },
        auto_return: 'approved',
        notification_url: `${env.BACKEND_URL}/api/webhooks/mercadopago`,
      },
    })
```

- [ ] **Step 2: Actualizar `mercadopago-webhook.service.ts`**

En `backend/src/services/mercadopago-webhook.service.ts`, cambiar el import:

```typescript
import { getMpPaymentClient } from '../lib/mercadopago.js'
```

Y al inicio de `procesarNotificacion`, reemplazar `const payment = await mpPayment.get({ id: paymentId })` por:

```typescript
    const mpPayment = await getMpPaymentClient()
    if (!mpPayment) {
      console.error(`[webhook mercadopago] no hay token de MP disponible (produccion sin cuenta conectada) - no se puede procesar pago ${paymentId}`)
      return { procesado: false }
    }

    const payment = await mpPayment.get({ id: paymentId })
```

- [ ] **Step 3: Verificar build completo**

Run: `cd backend && npm run build`
Expected: sin errores TypeScript.

- [ ] **Step 4: Correr el suite E2E del frontend (usa mocks, no pega contra MP real)**

Run: `cd frontend && npx playwright test`
Expected: 27/27 pasan (el mock de `tests/menu/checkout-mercadopago.spec.ts` intercepta la llamada HTTP, no le importa el cambio interno del backend).

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/checkout.service.ts backend/src/services/mercadopago-webhook.service.ts
git commit -m "fix(mercadopago): usar el token de MP resuelto dinamicamente en checkout y webhook"
```

---

### Task 8: Extraer `sendPushToAll` y agregar `notifyAdmins`

**Files:**
- Modify: `backend/src/services/notifications.service.ts`

**Interfaces:**
- Produces: metodo privado `NotificationsService.sendPushToAll(payload: { title: string; body: string }): Promise<{ sent: number }>`, metodo publico `NotificationsService.notifyAdmins(title: string, body: string): Promise<{ sent: number }>`. Usado por Task 9 (cron de MP) para alertar si falla el refresh.

- [ ] **Step 1: Extraer el helper y agregar `notifyAdmins`**

En `backend/src/services/notifications.service.ts`, agregar este metodo privado a la clase `NotificationsService` (antes de `sendDailyReminderIfNeeded`):

```typescript
  private static async sendPushToAll(payload: { title: string; body: string }): Promise<{ sent: number }> {
    const suscripciones = await prisma.pushSubscription.findMany()
    if (suscripciones.length === 0) return { sent: 0 }

    const json = JSON.stringify(payload)
    await Promise.allSettled(
      suscripciones.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          json
        )
      )
    )
    return { sent: suscripciones.length }
  }

  static async notifyAdmins(title: string, body: string): Promise<{ sent: number }> {
    const result = await NotificationsService.sendPushToAll({ title, body })
    console.log(`[NOTIF] Alerta enviada: "${title}" - ${result.sent} suscripciones`)
    return result
  }
```

- [ ] **Step 2: Reemplazar la logica duplicada en `sendDailyReminderIfNeeded`**

Dentro de `sendDailyReminderIfNeeded`, reemplazar desde `const suscripciones = await prisma.pushSubscription.findMany()` hasta el `await Promise.allSettled(...)` (todo el bloque de envio) por:

```typescript
    const payload = {
      title: `Pedidos para manana (${pedidos.length})`,
      body: `${names}${extra}`,
    }
    const result = await NotificationsService.sendPushToAll(payload)
    if (result.sent === 0) return
```

Nota: el `payload` original era `JSON.stringify({...})` — ahora `sendPushToAll` hace el `JSON.stringify` internamente, pasar el objeto plano.

- [ ] **Step 3: Reemplazar la logica duplicada en `forceSend`**

Reemplazar todo el cuerpo de `forceSend` por:

```typescript
  static async forceSend() {
    const result = await NotificationsService.sendPushToAll({
      title: 'Test de notificacion',
      body: 'Si ves esto, las push notifications funcionan correctamente.',
    })
    console.log(`[NOTIF] Force-send - ${result.sent} suscripciones`)
    return result
  }
```

- [ ] **Step 4: Verificar build**

Run: `cd backend && npm run build`
Expected: sin errores.

- [ ] **Step 5: Verificar manualmente que las notificaciones existentes siguen andando**

Run: `cd backend && npm run dev` (dejar corriendo), en otra terminal con el JWT del Step 3 de la Task 5:
```bash
curl -s -X POST http://localhost:3000/api/admin/notifications/test-send -H "Authorization: Bearer <token>"
```
Expected: `{"ok":true,"sent":N}` igual que antes del refactor (mismo comportamiento, codigo consolidado).

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/notifications.service.ts
git commit -m "refactor(notifications): extraer sendPushToAll y agregar notifyAdmins reutilizable"
```

---

### Task 9: Cron de renovacion automatica

**Files:**
- Create: `backend/src/jobs/mercadopago.cron.ts`
- Modify: `backend/src/index.ts`

**Interfaces:**
- Consumes: `MercadoPagoOAuthService.getConnection()`, `.refreshToken()`, `.saveConnection()` (Task 4); `NotificationsService.notifyAdmins()` (Task 8).
- Produces: `startMercadoPagoCron()`, llamada desde `index.ts` igual que `startNotificationsCron()`.

- [ ] **Step 1: Crear el cron**

Crear `backend/src/jobs/mercadopago.cron.ts`:

```typescript
import cron from 'node-cron'
import { MercadoPagoOAuthService } from '../services/mercadopago-oauth.service.js'
import { NotificationsService } from '../services/notifications.service.js'

const QUINCE_DIAS_MS = 15 * 24 * 60 * 60 * 1000

export function startMercadoPagoCron() {
  cron.schedule('0 6 * * *', async () => {
    try {
      const connection = await MercadoPagoOAuthService.getConnection()
      if (!connection) return

      const vencePronto = connection.expiresAt.getTime() - Date.now() < QUINCE_DIAS_MS
      if (!vencePronto) return

      const token = await MercadoPagoOAuthService.refreshToken(connection.refreshToken)
      await MercadoPagoOAuthService.saveConnection(token)
      console.log('[CRON] Token de Mercado Pago renovado')
    } catch (err) {
      console.error('[CRON] Error renovando token de Mercado Pago:', err)
      await NotificationsService.notifyAdmins(
        'Mercado Pago desconectado',
        'No se pudo renovar la conexion. Los pagos online estan deshabilitados hasta reconectar desde el panel.'
      )
    }
  })

  console.log('[CRON] Renovacion de Mercado Pago iniciada')
}
```

- [ ] **Step 2: Registrar el cron en `index.ts`**

En `backend/src/index.ts`, agregar el import:

```typescript
import { startMercadoPagoCron } from './jobs/mercadopago.cron.js'
```

Y dentro del callback de `serve(...)`, junto a `startNotificationsCron()`:

```typescript
serve({ fetch: app.fetch, port }, () => {
  console.log(`Server running on http://localhost:${port}`)
  startNotificationsCron()
  startMercadoPagoCron()
})
```

- [ ] **Step 3: Verificar arranque**

Run: `cd backend && npm run dev` (esperar los logs)
Expected: aparece `[CRON] Renovacion de Mercado Pago iniciada` junto al log existente de notificaciones. `Ctrl+C` para cortar.

- [ ] **Step 4: Commit**

```bash
git add backend/src/jobs/mercadopago.cron.ts backend/src/index.ts
git commit -m "feat(mercadopago): agregar cron de renovacion automatica del token OAuth"
```

---

### Task 10: Panel admin — conectar Mercado Pago desde el Dashboard

**Files:**
- Create: `frontend/src/api/mercadopago.ts`
- Create: `frontend/src/admin/dashboard/MercadoPagoConexion.tsx`
- Modify: `frontend/src/admin/DashboardPage.tsx`

**Interfaces:**
- Consumes: `GET /api/admin/mercadopago/status`, `GET /api/admin/mercadopago/authorize` (Task 5).
- Produces: componente `MercadoPagoConexion` renderizado en `DashboardPage`, mismo patron visual que `NotificacionesConfig`.

- [ ] **Step 1: Crear el modulo de API**

Crear `frontend/src/api/mercadopago.ts`:

```typescript
import { api } from './axios'

export interface MercadoPagoStatus {
  connected: boolean
  mpUserId?: string
  conectadoEn?: string
  expiresAt?: string
}

export const mercadopagoApi = {
  getStatus: () => api.get<MercadoPagoStatus>('/api/admin/mercadopago/status').then((r) => r.data),
  authorize: () => api.get<{ url: string }>('/api/admin/mercadopago/authorize').then((r) => r.data),
}
```

- [ ] **Step 2: Crear el componente**

Crear `frontend/src/admin/dashboard/MercadoPagoConexion.tsx`:

```tsx
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { mercadopagoApi } from '../../api/mercadopago'

export default function MercadoPagoConexion() {
  const { data: status, isLoading } = useQuery({
    queryKey: ['mercadopago', 'status'],
    queryFn: mercadopagoApi.getStatus,
  })

  const authorize = useMutation({
    mutationFn: mercadopagoApi.authorize,
    onSuccess: (data) => {
      window.location.href = data.url
    },
    onError: () => toast.error('No se pudo iniciar la conexion con Mercado Pago'),
  })

  return (
    <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(44,18,8,0.06)] overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-sand flex items-center gap-2">
        <span className="icon icon-fill text-[18px] text-terra">account_balance_wallet</span>
        <span className="font-bold text-[15px]">Mercado Pago</span>
        {!isLoading && status && (
          <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${status.connected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {status.connected ? 'Conectado' : 'No conectado'}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3">
        {isLoading ? (
          <div className="h-10 bg-sand rounded-lg animate-pulse" />
        ) : status?.connected ? (
          <>
            <p className="text-sm text-espresso">
              Los pagos online se acreditan en la cuenta de Mercado Pago <span className="font-bold">{status.mpUserId}</span>.
            </p>
            <button
              type="button"
              onClick={() => authorize.mutate()}
              disabled={authorize.isPending}
              className="self-start flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border border-sand-deep text-brown disabled:opacity-40 hover:border-terra hover:text-terra transition-colors"
            >
              Reconectar / cambiar cuenta
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">
              Sin conectar. El checkout con Mercado Pago no va a funcionar hasta que conectes la cuenta que va a recibir los pagos.
            </p>
            <button
              type="button"
              onClick={() => authorize.mutate()}
              disabled={authorize.isPending}
              className="self-start flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-terra text-white disabled:opacity-40 hover:bg-terra-dark transition-colors"
            >
              <span className="icon text-[16px]">link</span>
              {authorize.isPending ? 'Conectando...' : 'Conectar Mercado Pago'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Renderizar el componente en `DashboardPage.tsx` y mostrar toast segun `?mp=`**

En `frontend/src/admin/DashboardPage.tsx`, cambiar el import de React:

```typescript
import { useMemo, useState, useEffect } from 'react'
```

Agregar el import de `useSearchParams` junto al de `useNavigate`:

```typescript
import { useNavigate, useSearchParams } from 'react-router'
```

Agregar el import del componente nuevo junto a `NotificacionesConfig`:

```typescript
import MercadoPagoConexion from './dashboard/MercadoPagoConexion'
```

Dentro de `DashboardPage`, despues de `const navigate = useNavigate()`, agregar:

```typescript
  const [searchParams, setSearchParams] = useSearchParams()
  useEffect(() => {
    const mp = searchParams.get('mp')
    if (mp === 'conectado') {
      toast.success('Mercado Pago conectado correctamente')
      setSearchParams({}, { replace: true })
    } else if (mp === 'error') {
      toast.error('No se pudo conectar Mercado Pago, intenta de nuevo')
      setSearchParams({}, { replace: true })
    }
  }, [searchParams])
```

Y renderizar el componente junto a `<NotificacionesConfig />`:

```tsx
          <DeliveryDays />
          <NotificacionesConfig />
          <MercadoPagoConexion />
```

- [ ] **Step 4: Verificar build**

Run: `cd frontend && npm run build`
Expected: sin errores TypeScript.

- [ ] **Step 5: Verificacion manual end-to-end (development, con la cuenta del cliente ya lista)**

Con `backend` y `frontend` corriendo local (`npm run dev` en ambos):
1. Loguearse en `/admin/login`.
2. Entrar a `/admin`, ver la card "Mercado Pago" con estado "No conectado".
3. Click en "Conectar Mercado Pago" → redirige a `auth.mercadopago.com`.
4. Loguearse en Mercado Pago **con la cuenta del cliente** (no la del desarrollador) y autorizar.
5. Debe volver a `/admin?mp=conectado`, mostrar el toast de exito, y la card debe decir "Conectado" con el `mpUserId` de la cuenta del cliente.
6. Confirmar en la DB (`npx prisma studio`) que la tabla `mercado_pago_connections` tiene una fila con ese `mp_user_id`.

Expected: los 6 puntos se cumplen. Si el paso 3-4 falla con un error de MP sobre `redirect_uri`, revisar el prerequisito manual de la Task 6 (URL de redireccionamiento registrada en el panel de la app).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/api/mercadopago.ts frontend/src/admin/dashboard/MercadoPagoConexion.tsx frontend/src/admin/DashboardPage.tsx
git commit -m "feat(mercadopago): agregar conexion OAuth desde el panel admin"
```

---

## Post-implementacion (fuera de las tasks, manual)

1. Configurar la URL de redireccionamiento de produccion en el panel de la app "delahuerto" de MP (ver nota de la Task 6).
2. Cargar `MP_CLIENT_ID`/`MP_CLIENT_SECRET` en las env vars de `api-prod` en Dokploy (obtenidos con `get_credentials` del MCP de MP).
3. Redeploy de `api-prod` (aplica la migracion de la Task 1 automaticamente via el `CMD` del Dockerfile).
4. Hacer el flujo de conexion real (Task 10, Step 5) contra produccion con la cuenta del cliente.
5. `MP_ACCESS_TOKEN`/`MP_PUBLIC_KEY` estaticos de `api-prod` ya no se usan una vez conectado — se pueden dejar como estan (nunca se leen si hay fila en `MercadoPagoConnection`) o limpiarse mas adelante, no es urgente.

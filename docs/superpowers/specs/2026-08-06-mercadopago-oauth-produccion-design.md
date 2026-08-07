# Mercado Pago OAuth para produccion — design

## Contexto

`delaHuerto` es una app de pedidos para un negocio de empanadas. La integracion de Checkout Pro (implementada en sesiones anteriores) usa hoy credenciales estaticas (`MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`) de una aplicacion de Mercado Pago que pertenece al desarrollador (Sebastian), no al cliente dueno del negocio.

Como `api-prod` (backend de produccion, Dokploy) usa esas mismas credenciales, todos los pagos productivos caerian en la cuenta de MP del desarrollador en vez de la del cliente. Hay que resolver esto antes de anunciar la integracion al cliente.

Esto no es un marketplace (un solo vendedor, no reparto de comisiones entre varios), asi que no aplica el flujo de `marketplace_fee`. El problema es puramente de identidad: que cuenta de MP recibe la plata.

## Objetivo

Conectar `api-prod` a la cuenta de Mercado Pago del cliente sin que el cliente tenga que copiar y pegar sus propias credenciales de produccion a mano. El cliente autoriza la conexion con un click desde el panel admin; el backend obtiene y mantiene el token de esa cuenta automaticamente.

## Alcance

- Solo afecta **produccion**. Development sigue usando las credenciales estaticas de sandbox del desarrollador — no tiene sentido conectar la cuenta real del cliente para probar con plata falsa.
- Un solo cliente conectado (singleton). No es un feature multi-tenant.
- Sin split de comision (`marketplace_fee` no se usa, queda fuera de alcance).

## Arquitectura

### Modelo de datos nuevo

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

Fila unica (singleton, mismo patron que `NotificationConfig`). `accessToken` y `refreshToken` nunca se loguean ni se devuelven en respuestas de API — el endpoint de estado en el panel admin solo expone `mpUserId` (o el nombre de cuenta si la API de MP lo devuelve) y `conectadoEn`.

### Variables de entorno nuevas

- `MP_CLIENT_ID` / `MP_CLIENT_SECRET` — credenciales de la aplicacion "delahuerto" del desarrollador (AppID `3297872698083650`). Identifican la plataforma ante MP, no manejan plata de nadie, se pueden generar/rotar sin afectar al cliente.
- `MP_ACCESS_TOKEN` / `MP_PUBLIC_KEY` estaticas se mantienen sin cambios, pero pasan a usarse **solo si no hay una fila en `MercadoPagoConnection`** (comportamiento actual de development, y fallback si production todavia no conecto al cliente).

### Flujo de autorizacion (Authorization Code + PKCE, scope `offline_access`)

1. Admin autenticado entra a una seccion nueva del panel ("Configuracion") y ve el estado de la conexion MP: "No conectado" o "Conectado a [mpUserId]", con boton Conectar/Reconectar.
2. Click en Conectar → `GET /api/admin/mercadopago/oauth/authorize` (protegida por `authMiddleware`). Genera un `state` firmado (HMAC con `JWT_SECRET`, expira a los 10 minutos, sin tabla nueva) y devuelve la URL de autorizacion de MP (`https://auth.mercadopago.com/authorization?...&scope=offline_access&state=...`). El frontend redirige el browser del admin a esa URL.
3. El admin se loguea en Mercado Pago **con la cuenta del cliente** y autoriza la app.
4. MP redirige el browser a `GET /api/webhooks/mercadopago/oauth/callback` (publica por necesidad — MP redirige sin JWT). Se valida el `state` firmado (rechaza si vencio o no matchea), se intercambia el `code` por tokens en `POST https://api.mercadopago.com/oauth/token`, y se hace `upsert` de la fila singleton en `MercadoPagoConnection`.
5. Redirige de vuelta a `${FRONTEND_URL}/admin/configuracion?mp=conectado`.

### Uso del token en runtime

`lib/mercadopago.ts` expone una funcion `getMpAccessToken()` que:
- Si existe una fila en `MercadoPagoConnection` y no vencio → devuelve ese `accessToken`.
- Si no existe fila (production sin conectar todavia, o development) → devuelve `env.MP_ACCESS_TOKEN`.

`checkout.service.ts` (creacion de preferencia) y `mercadopago-webhook.service.ts` (verificacion de pago, `mpPayment.get`) usan esta funcion en vez del token estatico importado directo.

Si en produccion no hay conexion vigente y tampoco hay `MP_ACCESS_TOKEN` de fallback util (o el fallback es el token del desarrollador, que no queremos usar por accidente en prod), `crearPreference` devuelve `503 { error: 'Pago no disponible, contactar al administrador' }` en vez de crear una preferencia que cobre a la cuenta equivocada. **Regla dura: en `modo === 'production'`, si no hay fila en `MercadoPagoConnection`, jamas se usa `MP_ACCESS_TOKEN` estatico para crear preferencias ni consultar pagos** — se corta con 503.

### Refresh automatico

Cron diario (mismo `node-cron`, agregado junto al de notificaciones en `notifications.cron.ts` o un archivo nuevo `mercadopago.cron.ts` si crece). Chequea `expiresAt` de la fila singleton; si vence en menos de 15 dias, llama a `POST /oauth/token` con `grant_type=refresh_token`, actualiza `accessToken`, `refreshToken`, `expiresAt`.

### Alertas

Si el refresh falla (token revocado por el cliente, credenciales invalidas, etc.):
- Se loguea como error critico.
- Se envia una push notification al admin reusando el sistema existente. Se extrae un helper `sendPushToAll(payload: { title: string; body: string })` en `notifications.service.ts` (hoy la logica de `webpush.sendNotification` esta duplicada entre `sendDailyReminderIfNeeded` y `forceSend` — se consolida como parte de este cambio).
- El checkout empieza a devolver 503 hasta que alguien reconecte manualmente desde el panel.

## Seguridad

- `accessToken`/`refreshToken` del cliente: nunca en logs, nunca en respuestas de API, solo en la tabla `MercadoPagoConnection`.
- `state` firmado con HMAC (`JWT_SECRET`) y de un solo uso implicito por expiracion corta — evita que un tercero dispare el callback y pisen la conexion sin haber iniciado el flujo desde el panel autenticado.
- El callback (`/api/webhooks/mercadopago/oauth/callback`) es publico por necesidad (MP redirige el browser sin credenciales), pero sin un `state` valido no hace nada.
- `MP_CLIENT_SECRET` es sensible (permite intercambiar codigos de autorizacion) pero no da acceso directo a fondos de nadie — se trata como cualquier otro secreto de env var, nunca hardcodeado.

## Fuera de alcance

- `marketplace_fee` / split de comision entre plataforma y vendedor.
- Soporte multi-tenant (mas de un cliente/cuenta conectada simultaneamente).
- Reautorizacion automatica sin intervencion humana si el refresh_token se invalida (requiere que alguien vuelva a apretar Conectar).
- UI de historial de conexiones/desconexiones (solo se guarda el estado actual).

## Riesgo abierto a validar durante la implementacion

No esta confirmado si Mercado Pago distingue el flujo OAuth de autorizacion en modo test vs. modo produccion de la misma manera que distingue credenciales estaticas TEST-/APP_USR-. Se valida el flujo completo con la cuenta real del cliente durante el rollout; si hay algun bloqueo especifico de MP en ese paso, se ajusta el plan en ese momento.

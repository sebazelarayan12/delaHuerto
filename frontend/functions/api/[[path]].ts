interface Env {
  BACKEND_ORIGIN: string
}

// Proxy /api/* desde delahuerto.pages.dev hacia el backend real en Dokploy.
// Necesario porque algunos operadores de datos moviles bloquean el dominio
// sslip.io del backend (DNS/firewall por heuristica anti-abuso) mientras que
// pages.dev nunca se bloquea -- el celular carga el frontend pero no puede
// llegar a la API directo. Con este proxy el navegador solo habla con
// pages.dev; Cloudflare reenvia server-to-server, fuera del alcance del
// operador.
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context

  if (!env.BACKEND_ORIGIN) {
    return new Response('BACKEND_ORIGIN no configurado en Cloudflare Pages', { status: 500 })
  }

  const segments = params.path
  const path = Array.isArray(segments) ? segments.join('/') : (segments ?? '')
  const incomingUrl = new URL(request.url)
  const targetUrl = `${env.BACKEND_ORIGIN}/api/${path}${incomingUrl.search}`

  const headers = new Headers(request.headers)
  headers.delete('host')

  const hasBody = !['GET', 'HEAD'].includes(request.method)

  return fetch(targetUrl, {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    redirect: 'manual',
    // Requerido por la Fetch API cuando el body es un stream (uploads de fotos).
    duplex: hasBody ? 'half' : undefined,
  } as RequestInit)
}

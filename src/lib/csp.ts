/**
 * Content-Security-Policy como `<meta http-equiv>` en el `<head>`.
 *
 * GitHub Pages es un host estático: no permite configurar cabeceras de
 * respuesta, así que los headers de seguridad de `next.config` (`headers()`)
 * simplemente no existen acá. La CSP sí se puede declarar en el HTML y es la
 * que importa para XSS; el resto (HSTS, `X-Frame-Options`) queda en manos del
 * transporte de Pages (sirve HTTPS forzado) o del CDN si algún día se pone
 * delante (Cloudflare). Con `frame-ancestors` la versión en meta es ignorada
 * por los navegadores: se documenta en `docs/deploy.md` como limitación, no
 * como protección.
 *
 * Diferencias respecto del modo servidor: sin `'unsafe-eval'` (solo en dev), y
 * `connect-src` tiene que conocer el origin del webhook de reservas porque la
 * llamada la hace el navegador (en Pages no hay backend propio).
 */
export function cspMeta(): string {
  const isDev = process.env.NODE_ENV !== "production";
  const webhook = process.env.NEXT_PUBLIC_BOOKING_WEBHOOK_URL ?? "";
  let webhookOrigin = "";
  if (webhook) {
    try {
      webhookOrigin = new URL(webhook).origin;
    } catch {
      webhookOrigin = "";
    }
  }

  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    // data:/blob: son los placeholders blur y el audio sintetizado en el cliente.
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "media-src 'self' blob: data:",
    `connect-src 'self'${webhookOrigin ? ` ${webhookOrigin}` : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'none'",
    isDev ? "" : "upgrade-insecure-requests",
  ]
    .filter(Boolean)
    .join("; ");
}

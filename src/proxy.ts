import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * Next 16 renombró `middleware.ts` a `proxy.ts` (runtime Node.js fijo).
 * next-intl 4 sigue exportando `createMiddleware`; la lógica no cambia.
 * Se encarga de: detección de idioma, redirect `/` → `/{locale}` y links
 * alternates (hreflang) para SEO.
 */
export const proxy = createMiddleware(routing);

export const config = {
  /**
   * No interferir con assets, API ni archivos de la raíz (robots, sitemap).
   * `og` va en la exclusión porque la imagen social vive en `/og/[locale]`,
   * FUERA del segmento de idioma: si el proxy la reescribe a `/es/og/es`,
   * el `og:image` responde 404 y el card de WhatsApp/IG sale sin imagen.
   */
  matcher: "/((?!api|trpc|og|_next|_vercel|.*\\..*).*)",
};

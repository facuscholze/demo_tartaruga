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
  // No interferir con assets, API ni archivos de la raíz (robots, sitemap).
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};

import { defineRouting } from "next-intl/routing";

/**
 * ES por defecto (Punta Colorada es Uruguay). EN para turismo.
 * PT ya está preparado (turismo brasileño y argentino): solo hace falta
 * completar `messages/pt.json` y el selector lo muestra automáticamente.
 *
 * `localePrefix: "always"` + `localeDetection: false`: en GitHub Pages no hay
 * middleware que negocie el idioma, así que cada versión vive en su ruta
 * (`/es/`, `/en/`, `/pt/`) y se prerendera completa. La raíz `/` es una página
 * mínima que redirige según `navigator.language` (con `<meta refresh>` y links
 * visibles como respaldo sin JS): ver `scripts/pages-static.ts`.
 */
export const routing = defineRouting({
  locales: ["es", "en", "pt"],
  defaultLocale: "es",
  localePrefix: "always",
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
export const availableLocales = routing.locales;
export const defaultLocale = routing.defaultLocale;

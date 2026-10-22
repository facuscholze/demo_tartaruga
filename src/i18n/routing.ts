import { defineRouting } from "next-intl/routing";

/**
 * ES por defecto (Punta Colorada es Uruguay). EN para turismo.
 * PT ya está preparado (turismo brasileño y argentino): solo hace falta
 * completar `messages/pt.json` y el selector lo muestra automáticamente.
 */
export const routing = defineRouting({
  locales: ["es", "en", "pt"],
  defaultLocale: "es",
  localePrefix: "as-needed",
  localeDetection: true,
});

export type Locale = (typeof routing.locales)[number];
export const availableLocales = routing.locales;
export const defaultLocale = routing.defaultLocale;

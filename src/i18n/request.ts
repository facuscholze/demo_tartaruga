import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing, defaultLocale } from "./routing";

/**
 * next-intl 4 exige devolver `locale` explícitamente: si falta, el layout
 * lanza "Unable to find locale" (el error clásico al migrar a Next 16).
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: "America/Montevideo",
    now: new Date(),
  };
});

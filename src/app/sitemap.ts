import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/base";
import { routing } from "@/i18n/routing";

/** Se evalúa una sola vez, en build. */
export const dynamic = "force-static";

/**
 * En Pages esto se materializa a `out/sitemap.xml` en el build: no hay runtime.
 * Las URLs salen de `NEXT_PUBLIC_SITE_URL` + `NEXT_PUBLIC_BASE_PATH`, así el
 * mismo build sirve para project pages y para un dominio propio.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const url = (locale: string) => absoluteUrl(`/${locale}/`);

  return routing.locales.map((locale) => ({
    url: url(locale),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: locale === routing.defaultLocale ? 1 : 0.85,
    alternates: {
      languages: Object.fromEntries(routing.locales.map((alt) => [alt, url(alt)])),
    },
  }));
}

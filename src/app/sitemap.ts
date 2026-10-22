import type { MetadataRoute } from "next";
import { getSiteContent } from "@/features/content/load";
import { routing } from "@/i18n/routing";

/** Un solo destino por idioma, con `alternate` para que Google indexe las 3. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.tartaruga.arena.site").replace(
    /\/$/,
    "",
  );
  const content = await getSiteContent();
  const now = new Date();
  void content;

  return routing.locales.map((locale) => ({
    url: locale === routing.defaultLocale ? `${base}/` : `${base}/${locale}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: locale === routing.defaultLocale ? 1 : 0.85,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((alt) => [
          alt,
          alt === routing.defaultLocale ? `${base}/` : `${base}/${alt}`,
        ]),
      ),
    },
  }));
}

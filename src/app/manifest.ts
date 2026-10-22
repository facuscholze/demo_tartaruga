import type { MetadataRoute } from "next";
import { getSiteContent } from "@/features/content/load";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const content = await getSiteContent();
  return {
    name: content.site.name,
    short_name: "Tartaruga",
    description: content.site.seo.description.es,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0E1526",
    theme_color: "#0E1526",
    lang: "es",
    icons: [
      {
        src: "/images/brand/logo-tortuga.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}

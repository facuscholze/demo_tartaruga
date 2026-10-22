import type { MetadataRoute } from "next";
import { getSiteContent } from "@/features/content/load";
import { withBase } from "@/lib/base";

/** El manifest lee contenido del disco: sin `force-static` Next lo trataría como ruta dinámica y `output: "export"` no puede servirla. */
export const dynamic = "force-static";

/**
 * PWA mínima: ícono SVG propio y `start_url` con el prefijo del despliegue
 * (si no, en project pages el manifest apuntaría a la raíz del dominio).
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const content = await getSiteContent();
  return {
    name: content.site.name,
    short_name: "Tartaruga",
    description: content.site.seo.description.es,
    start_url: withBase("/es/"),
    scope: withBase("/"),
    display: "standalone",
    background_color: "#0E1526",
    theme_color: "#0E1526",
    lang: "es",
    icons: [
      {
        src: withBase("/images/brand/logo-tortuga.svg"),
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    categories: ["food", "travel"],
  };
}

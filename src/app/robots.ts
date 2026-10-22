import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/base";

/** Se evalúa una sola vez, en build. */
export const dynamic = "force-static";

/** Se escribe como `out/robots.txt` en el build (Pages no ejecuta nada). */
export default function robots(): MetadataRoute.Robots {
  return {
    // Sin `Host`: es una directiva de Yandex y, en project pages, apuntaría a la
    // raíz del dominio y no al sitio real.
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}

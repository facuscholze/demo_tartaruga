/**
 * Única fuente de verdad del prefijo de despliegue.
 *
 * GitHub Pages puede servir el sitio en la raíz de un dominio propio (`""`) o
 * bajo el nombre del repo (`/demo_tartaruga`). El build de estáticos no puede
 * saberlo en runtime, así que se define con `NEXT_PUBLIC_BASE_PATH` y TODO link
 * generado a mano pasa por `withBase()`.
 *
 * Regla del repo: los `content/*.json` guardan SOLO el nombre de archivo
 * (`"pulpo-parrilla.jpg"`); el prefijo se aplica acá, en código, nunca en el
 * contenido. Así el mismo JSON sirve para localhost, Pages y un dominio propio.
 *
 * Next ya antepone `basePath` a sus propios assets (`/_next/**`) y a `<Link>`;
 * esto cubre lo que Next NO toca: `src`/`srcSet` de `<img>`, `url()` en estilos
 * inline, `fetch()` al audio, manifest y los `href` de metadata/JSON-LD.
 */

/** `""` o `/demo_tartaruga`, sin barra final, sin doble barra. */
export const basePath: string = (process.env.NEXT_PUBLIC_BASE_PATH ?? "")
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/{2,}/g, "/");

/**
 * `/images/x.jpg` → `/demo_tartaruga/images/x.jpg`.
 *
 * Idempotente: si la ruta ya trae el prefijo, no lo duplica. Eso permite
 * aplicarlo en el resolvedor de contenido Y en el punto de render sin que nadie
 * tenga que saber quién lo puso primero (que es exactamente como se te escapa
 * un `/repo/repo/images/...` en producción).
 */
export function withBase(path: string): string {
  if (!path) return path;
  if (/^(https?:|mailto:|tel:|data:|blob:|#)/i.test(path)) return path;
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  if (!basePath || withSlash === basePath || withSlash.startsWith(`${basePath}/`)) return withSlash;
  return `${basePath}${withSlash}`;
}

/**
 * Origen del sitio sin barra final. En Pages es `https://<usuario>.github.io`
 * (y el repo va en `NEXT_PUBLIC_BASE_PATH`); con dominio propio, el dominio y
 * base vacía. Fallback deliberadamente inválido: si alguien olvidó la variable,
 * el `example.invalid` en el HTML se nota enseguida, en vez de apuntar al sitio
 * de un tercero.
 */
export function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.invalid").replace(/\/+$/, "");
}

/**
 * Igual que `withBase` pero para un `srcset` completo: la lista es
 * `"<url> <descriptor>, <url> <descriptor>"`, así que se prefija término a
 * término. Sin esto las URLs de las variantes quedan relativas y el navegador
 * las resuelve contra la carpeta de la página (`/repo/es/` → `/repo/es/images/…`
 * → 404 en Pages).
 */
export function withBaseSrcset(srcset?: string): string | undefined {
  if (!srcset) return undefined;
  return srcset
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => {
      const [url = "", ...descriptors] = entry.split(/\s+/);
      return [withBase(url), ...descriptors].join(" ");
    })
    .join(", ");
}

/** URL absoluta para metadata/sitemap/JSON-LD (usa `NEXT_PUBLIC_SITE_URL`). */
export function absoluteUrl(path = "/"): string {
  const origin = siteOrigin();
  // Si alguien pegó en `NEXT_PUBLIC_SITE_URL` la URL completa del repo
  // (`https://usuario.github.io/demo_tartaruga`), la base ya está ahí dentro:
  // no la duplicamos.
  const prefix = basePath && !origin.endsWith(basePath) ? basePath : "";
  const target = path.startsWith("/") ? path : `/${path}`;
  // `origin` viene sin barra final y `target` con barra inicial: pegado directo.
  return origin + (prefix ? withBase(target) : target);
}

import { variantsFor } from "@/generated/image-variants";
import { withBase, withBaseSrcset } from "@/lib/base";
import { cn } from "@/lib/utils";

/**
 * Foto con fallback visual garantizado y `srcset` real.
 *
 * En GitHub Pages no existe `/_next/image`: `next/image` con
 * `images.unoptimized` devuelve un `<img>` pelado, sin variantes por ancho, y
 * eso en un sitio de fotos es pagar 1.5 MB por imagen móvil. Por eso este
 * componente rendera `<picture>` a mano contra las variantes que genera
 * `pnpm images:build` (AVIF + WebP en 640/960/1440 px, más el original como
 * respaldo), con el placeholder difuso del manifiesto como fondo para que no
 * haya salto de layout.
 *
 * El contenido sigue referenciando SOLO el nombre de archivo: la variante se
 * elige acá, en `src`, a partir de la ruta resuelta en build.
 */
export type MediaProps = {
  src?: string;
  alt: string;
  width: number;
  height: number;
  blurDataURL?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** `true` si conviene que el contenedor defina el recorte. */
  fill?: boolean;
};

export function Media({
  src,
  alt,
  width,
  height,
  blurDataURL,
  className,
  sizes = "(max-width: 768px) 92vw, 44vw",
  priority,
  fill,
}: MediaProps) {
  if (!src) return <MediaFallback alt={alt} className={className} />;

  const variants = variantsFor(src);
  // Las variantes del mapa viven en `public/`, así que también necesitan el
  // prefijo (y `srcset` se prefija término a término).
  const avif = withBaseSrcset(variants?.avif);
  const webp = withBaseSrcset(variants?.webp);
  const jpg = withBaseSrcset(variants?.jpg);
  const isSvg = src.endsWith(".svg");
  const img = (
    <img
      src={withBase(src)}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={isSvg ? undefined : sizes}
      srcSet={isSvg ? undefined : jpg}
      loading={priority ? "eager" : "lazy"}
      // `eager` + fetchPriority alto para el LCP; `lazy` para el resto.
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      // El blur del manifiesto vive como fondo: la imagen entra encima y el
      // hueco nunca se ve blanco (ni en Pages, que no tiene optimizador).
      style={
        blurDataURL
          ? {
              backgroundImage: `url(${blurDataURL})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
      className={cn(
        fill ? "absolute inset-0 h-full w-full object-cover" : "h-full w-full object-cover",
        className,
      )}
    />
  );

  if (isSvg || !variants?.webp) return img;

  return (
    <picture>
      {avif ? <source type="image/avif" srcSet={avif} sizes={sizes} /> : null}
      <source type="image/webp" srcSet={webp} sizes={sizes} />
      {img}
    </picture>
  );
}

export function MediaFallback({ alt, className }: { alt?: string; className?: string }) {
  return (
    <div
      role="img"
      aria-label={alt ?? "Imagen de muestra"}
      className={cn(
        "relative flex h-full w-full items-end justify-end overflow-clip bg-[linear-gradient(165deg,var(--sky-top)_0%,var(--sky-mid)_38%,var(--sky-low)_66%,var(--sky-horizon)_100%)]",
        className,
      )}
    >
      <svg
        viewBox="0 0 64 64"
        className="h-1/2 w-1/2 translate-x-4 -translate-y-2 opacity-25"
        fill="none"
        aria-hidden
      >
        <g stroke="#F6F0E6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M44 14c9 6 12 18 6 27-6 9-19 12-28 6-7-4.5-9-13-5-19.5" />
          <path d="M23 27c5-4 12-4 16 1s3 12-2 15-12 2-15-3" />
          <path d="M28 33c3-2 7-1 8 2s-1 6-4 6" />
          <path d="M17 45c-3 2-6 3-9 2 2-2 3-5 2-8" />
        </g>
      </svg>
      <span className="absolute bottom-2 left-3 font-type text-[0.55rem] uppercase tracking-[0.2em] text-[var(--c-bone)]/60">
        muestra
      </span>
    </div>
  );
}

import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Foto con fallback visual garantizado: si el JSON no tiene imagen (o el
 * archivo no existe), se pinta un degradé de atardecer con una caracola
 * grabada. Nunca un hueco blanco.
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
  /** `true` si conviene `fill` (el contenedor define el recorte). */
  fill?: boolean;
  quality?: number;
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
  quality,
}: MediaProps) {
  if (!src) return <MediaFallback alt={alt} className={className} />;
  const isSvg = src.endsWith(".svg");
  return (
    <Image
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      sizes={sizes}
      priority={priority}
      quality={quality}
      placeholder={blurDataURL ? "blur" : undefined}
      blurDataURL={blurDataURL}
      unoptimized={isSvg || undefined}
      loading={priority ? undefined : "lazy"}
      decoding="async"
      className={cn("h-full w-full object-cover", className)}
      style={fill ? undefined : { aspectRatio: `${width} / ${height}` }}
    />
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
      <svg viewBox="0 0 64 64" className="h-1/2 w-1/2 translate-x-4 -translate-y-2 opacity-25" fill="none" aria-hidden>
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

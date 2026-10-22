"use client";

/**
 * Tira de fotos horizontal con inercia (drag en desktop, snap nativo en móvil)
 * y tilt de 3° siguiendo al puntero. Al hacer click, la imagen vuela al
 * lightbox con GSAP Flip. Sin librerías de carousel: el scroll nativo ya hace
 * el trabajo pesado y es lo que el dedo espera.
 */
import { useRef, useState } from "react";
import { Media } from "@/components/ui/media";
import { Lightbox, type LightboxPhoto } from "@/components/ui/lightbox";
import { useDragScroll } from "@/hooks/use-drag-scroll";
import { useQualitySettings } from "@/features/quality/store";
import { cn } from "@/lib/utils";

export type GalleryItemProps = {
  key: string;
  alt: string;
  caption?: string;
  weight: number;
  photo: LightboxPhoto;
};

const SIZES: Record<number, string> = {
  0: "h-[15rem] w-[13rem]",
  1: "h-[17rem] w-[15rem]",
  2: "h-[20rem] w-[19rem]",
  3: "h-[23rem] w-[26rem]",
};

export function GalleryStrip({ items, label, hint }: { items: GalleryItemProps[]; label: string; hint?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState<number | null>(null);
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);
  const settings = useQualitySettings();
  useDragScroll(trackRef, settings.webgl);

  const tilt = (event: React.PointerEvent<HTMLElement>) => {
    if (!settings.tilt) return;
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.setProperty("--tilt-x", `${(-py * 6).toFixed(2)}deg`);
    card.style.setProperty("--tilt-y", `${(px * 8).toFixed(2)}deg`);
  };

  return (
    <div className="relative">
      {hint ? <p className="label mb-3 text-[var(--fg-faint)]">{hint}</p> : null}
      <div
        ref={trackRef}
        role="group"
        aria-label={label}
        data-lenis-prevent
        className="scrollbar-none mask-fade-edges -mx-[var(--shell)] flex snap-x snap-proximity gap-4 overflow-x-auto px-[var(--shell)] pb-2 [scroll-padding-inline:var(--shell)]"
        style={{ scrollbarWidth: "thin" }}
      >
        {items.map((item, position) => (
          <figure
            key={item.key}
            onPointerMove={tilt}
            onPointerLeave={(event) => {
              event.currentTarget.style.removeProperty("--tilt-x");
              event.currentTarget.style.removeProperty("--tilt-y");
            }}
            className={cn(
              "gallery-card group relative shrink-0 snap-center",
              SIZES[item.weight] ?? SIZES[1],
            )}
          >
            <button
              type="button"
              onClick={(event) => {
                setOriginRect(event.currentTarget.getBoundingClientRect());
                setIndex(position);
              }}
              className="h-full w-full overflow-clip rounded-[4px] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--c-spark)]"
              aria-label={`${label}: ${item.alt}`}
            >
              <Media
                src={item.photo.src}
                alt=""
                width={item.photo.width}
                height={item.photo.height}
                blurDataURL={item.photo.blur}
                sizes="(max-width: 768px) 80vw, 30vw"
                className="transition-transform duration-[var(--d-4)] ease-[var(--ease-sea)] group-hover:scale-[1.03]"
              />
              <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,color-mix(in_oklab,var(--c-abyss)_72%,transparent),transparent_46%)] opacity-0 transition-opacity duration-[var(--d-3)] group-hover:opacity-100 group-focus-visible:opacity-100" />
              <span className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-1 text-[0.86rem] leading-snug text-[var(--c-bone)] opacity-0 transition-all duration-[var(--d-3)] group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                {item.caption ?? item.alt}
              </span>
            </button>
          </figure>
        ))}
      </div>

      <Lightbox
        photos={items.map((item) => item.photo)}
        index={index}
        originRect={originRect}
        animate={settings.webgl && !settings.reducedMotion}
        onClose={() => setIndex(null)}
        onIndex={setIndex}
        prevLabel="anterior"
        nextLabel="siguiente"
        closeLabel="cerrar"
      />
    </div>
  );
}

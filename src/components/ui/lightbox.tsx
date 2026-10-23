"use client";

/**
 * Visor a pantalla completa. Radix Dialog pone foco, `Esc` y `aria-modal`;
 * GSAP Flip hace el vuelo desde la miniatura; `Observer` (plugin libre de GSAP)
 * lee el swipe horizontal para pasar fotos. Sin WebGL o con reduced motion
 * sigue funcionando: es un dialog con flechas.
 */
import * as Dialog from "@radix-ui/react-dialog";
import { useCallback, useEffect, useRef } from "react";
import { Media } from "@/components/ui/media";

export type LightboxPhoto = {
  src?: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
  blur?: string;
};

export function Lightbox({
  photos,
  index,
  originRect,
  animate,
  onClose,
  onIndex,
  prevLabel,
  nextLabel,
  closeLabel,
}: {
  photos: LightboxPhoto[];
  index: number | null;
  originRect: DOMRect | null;
  animate: boolean;
  onClose: () => void;
  onIndex: (index: number) => void;
  prevLabel: string;
  nextLabel: string;
  closeLabel: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const open = index !== null;

  const step = useCallback(
    (delta: number) => {
      if (index === null) return;
      onIndex((index + delta + photos.length) % photos.length);
    },
    [index, onIndex, photos.length],
  );

  // Vuelo Flip + swipe por Observer, con import dinámico: el peso vive acá.
  useEffect(() => {
    if (!open || !animate || !originRect) return;
    let cleanup = () => {};
    let cancelled = false;

    void import("@/lib/gsap").then(async (gsapModule) => {
      if (cancelled) return;
      gsapModule.setupGsap();
      const { gsap, Flip, Observer } = gsapModule;
      const panel = panelRef.current;
      if (!panel) return;
      const state = Flip.getState(panel, { props: "borderRadius" });
      panel.style.setProperty("--lb-scale", "1");
      const bounds = originRect;
      gsap.set(panel, {
        x: bounds.left + bounds.width / 2 - (panel.offsetLeft + panel.offsetWidth / 2),
        y: bounds.top + bounds.height / 2 - (panel.offsetTop + panel.offsetHeight / 2),
        scale: Math.max(0.2, bounds.width / panel.offsetWidth),
        opacity: 0.2,
      });
      Flip.from(state, { duration: 0.55, ease: "swell", absolute: false });

      const observer = Observer.create({
        target: panel,
        type: "touch,pointer",
        tolerance: 24,
        preventDefault: false,
        onLeft: () => step(1),
        onRight: () => step(-1),
      });
      cleanup = () => observer.kill();
    });

    return () => {
      cancelled = true;
      cleanup();
    };
    // Solo al abrir: los botones de paso se manejan con `step` y teclado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index === null ? "closed" : "open"]);

  const photo = index === null ? null : photos[index];

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-[color-mix(in_oklab,var(--c-abyss)_88%,transparent)] backdrop-blur-[2px] data-[state=open]:animate-[fade-up_220ms_var(--ease-sea)]" />
        <Dialog.Content
          ref={panelRef}
          className="fixed inset-[max(4svh,1rem)] z-[71] flex flex-col gap-3 rounded-[4px] border border-[var(--line)] bg-[var(--c-night)] p-3 outline-none sm:inset-[max(6svh,2rem)]"
          onPointerDown={(event) => {
            // Cerrar tocando el fondo, sin romper el drag del Observer.
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <Dialog.Title className="sr-only">{photo?.alt ?? "Imagen"}</Dialog.Title>
          <div className="relative flex-1 overflow-clip rounded-[3px]">
            {photo ? (
              <Media
                key={photo.src ?? photo.alt}
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                blurDataURL={photo.blur}
                fill
                priority
                sizes="100vw"
                className="object-contain"
              />
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="max-w-[70ch] text-[0.85rem] text-[var(--fg-muted)]">
              {photo?.caption ?? photo?.alt}
            </p>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="price mr-2 text-[0.72rem] text-[var(--fg-faint)]">
                {index === null ? 0 : index + 1}/{photos.length}
              </span>
              <button
                type="button"
                className="lb-nav"
                onClick={() => step(-1)}
                aria-label={prevLabel}
              >
                ←
              </button>
              <button
                type="button"
                className="lb-nav"
                onClick={() => step(1)}
                aria-label={nextLabel}
              >
                →
              </button>
              <Dialog.Close asChild>
                <button type="button" className="lb-nav" aria-label={closeLabel}>
                  ✕
                </button>
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

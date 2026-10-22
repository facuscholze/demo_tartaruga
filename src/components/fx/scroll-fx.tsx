"use client";

/**
 * Coreografía global de scroll (GSAP + ScrollTrigger), montada una sola vez en
 * el layout. Cada sección declara su comportamiento con atributos de datos:
 *
 *   data-reveal               → máscara ascendente + leve parallax interno
 *   data-reveal="words"       → SplitText por palabras
 *   data-reveal="fade"        → fundido simple (para bloques de texto)
 *   data-parallax="0.12"      → desplazamiento en Y proporcional (0..1)
 *   data-pin                  → se fija mientras dura su contenedor
 *   data-scroll-to            → ancla suave vía Lenis (con focus en el destino)
 *
 * Todo se registra en un `gsap.context()` para que el cleanup sea total. Con
 * `prefers-reduced-motion` se sale antes de importar GSAP: cero animaciones.
 */
import { useEffect } from "react";
import { useLenis } from "@/hooks/use-lenis";
import { setScrollTint } from "@/features/sky/bus";
import { usePathname } from "@/i18n/navigation";

export function ScrollFx() {
  const { lenis } = useLenis();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let context: { revert: () => void } | null = null;
    let cleanupTint: (() => void) | null = null;

    void import("@/lib/gsap").then((module) => {
      module.setupGsap();
      const { gsap, ScrollTrigger, SplitText } = module;
      if (!gsap) return;

      context = gsap.context(() => {
        // Reveals enmascarados (imagen/papel que "sube" desde abajo).
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
          const mode = element.dataset.reveal || "mask";
          const items = mode === "words" ? SplitText.create(element, { type: "words", wordsClass: "reveal-word" }).words : [element];

          if (mode === "words") {
            gsap.set(items, { opacity: 0, yPercent: 78, rotate: 1.5, transformOrigin: "0% 100%" });
            gsap.to(items, {
              opacity: 1,
              yPercent: 0,
              rotate: 0,
              duration: 1.05,
              ease: "sea",
              stagger: 0.035,
              scrollTrigger: { trigger: element, start: "top 86%", once: true },
            });
          } else if (mode === "fade") {
            gsap.fromTo(
              element,
              { opacity: 0, y: 18 },
              {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: "sea",
                scrollTrigger: { trigger: element, start: "top 88%", once: true },
              },
            );
          } else {
            gsap.fromTo(
              element,
              { clipPath: "inset(100% 0 0 0)", y: "8%", scale: 1.06 },
              {
                clipPath: "inset(0% 0% 0% 0%)",
                y: "0%",
                scale: 1,
                duration: 1.25,
                ease: "sea",
                scrollTrigger: { trigger: element, start: "top 84%", once: true },
              },
            );
          }
        });

        // Parallax suave: se puede encender/apagar con data-parallax="0.12".
        gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((element) => {
          const strength = Number(element.dataset.parallax ?? 0.08);
          const inner = element.firstElementChild as HTMLElement | null;
          gsap.fromTo(
            inner ?? element,
            { yPercent: -strength * 100 },
            {
              yPercent: strength * 100,
              ease: "none",
              scrollTrigger: {
                trigger: element,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.6,
                invalidateOnRefresh: true,
              },
            },
          );
        });

        // Pineaos de secciones (Lugar / Sunset).
        gsap.utils.toArray<HTMLElement>("[data-pin]").forEach((element) => {
          ScrollTrigger.create({
            trigger: element,
            start: "top top",
            end: () => `+=${element.offsetHeight * 0.55}`,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
          });
        });

        // El cielo se oscurece y el fuego crece al bajar del hero hacia la noche.
        const hero = document.querySelector<HTMLElement>("[data-hero]");
        if (hero) {
          const driver = () => {
            const rect = hero.getBoundingClientRect();
            const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, window.innerHeight * 0.9)));
            setScrollTint(progress);
          };
          ScrollTrigger.create({ trigger: hero, start: "top top", end: "bottom top", onUpdate: driver, onRefresh: driver });
          cleanupTint = () => setScrollTint(0);
        }
      });

      // Refresca cuando cargan las imágenes (si no, los triggers quedan cortos).
      const onLoad = () => ScrollTrigger.refresh();
      if (document.fonts?.ready) void document.fonts.ready.then(onLoad);
      window.addEventListener("load", onLoad);
      return () => window.removeEventListener("load", onLoad);
    });

    return () => {
      context?.revert();
      cleanupTint?.();
    };
  }, [pathname]);

  /* Anclas: Lenis lleva el scroll y movemos el foco para que sea accesible. */
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>("a[data-scroll-to]");
      if (!anchor) return;
      const hash = anchor.getAttribute("href");
      if (!hash || !hash.startsWith("#")) return;
      const target = document.querySelector<HTMLElement>(hash);
      if (!target) return;
      event.preventDefault();
      const offset = (parseInt(getComputedStyle(document.documentElement).getPropertyValue("--header-h"), 10) || 66) + 8;
      if (lenis) {
        lenis.scrollTo(target, { offset: -offset, duration: 1.4 });
      } else {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [lenis]);

  return null;
}

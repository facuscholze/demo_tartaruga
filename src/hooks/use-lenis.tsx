"use client";

/**
 * Lenis + ScrollTrigger sincronizados en una única instancia. Se apaga con
 * `prefers-reduced-motion` y en tier `low`, donde el scroll nativo anda mejor.
 */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type Lenis from "lenis";

type LenisApi = { lenis: Lenis | null; scrollTo: (target: string | HTMLElement, offset?: number) => void };

const LenisContext = createContext<LenisApi>({ lenis: null, scrollTo: () => {} });

export function useLenis() {
  return useContext(LenisContext);
}

export function LenisProvider({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) {
  const lenisRef = useRef<Lenis | null>(null);
  const [api, setApi] = useState<LenisApi>({ lenis: null, scrollTo: () => {} });

  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    let lenis: Lenis | null = null;

    void (async () => {
      const [lenisModule, gsapModule] = await Promise.all([import("lenis"), import("@/lib/gsap")]);
      if (disposed) return;
      const LenisClass = lenisModule.default;
      const { gsap, ScrollTrigger } = gsapModule;

      lenis = new LenisClass({
        lerp: 0.085,
        wheelMultiplier: 0.92,
        touchMultiplier: 1.4,
        smoothWheel: true,
        syncTouch: false,
      });
      lenisRef.current = lenis;

      lenis.on("scroll", ScrollTrigger.update);
      const raf = (time: number) => lenis?.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      setApi({
        lenis,
        scrollTo: (target, offset = 0) => {
          lenis?.scrollTo(target, {
            duration: 1.35,
            offset: -offset,
            easing: (t) => 1 - Math.pow(1 - t, 4),
          });
        },
      });
    })();

    return () => {
      disposed = true;
      lenis?.destroy();
      lenisRef.current = null;
      void import("@/lib/gsap").then(({ gsap }) => gsap.ticker.remove(() => {}));
    };
  }, [enabled]);

  return <LenisContext.Provider value={api}>{children}</LenisContext.Provider>;
}

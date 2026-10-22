"use client";

/**
 * Detecta la calidad real del dispositivo y la publica en el store + en
 * `<html data-quality>`. Tres señales duras (GPU, cores, memoria) y una blanda:
 * FPS REAL medido los primeros ~2.2 s. Si el visitante ya eligió "Efectos" a
 * mano, no lo tocamos nunca.
 */
import { useEffect } from "react";
import { useQualityStore } from "./store";
import {
  connectionQuality,
  detectQuality,
  measureFps,
  probeGpu,
  webglAvailable,
  type Quality,
} from "./tiers";
import { isMobileViewport } from "@/lib/utils";

export function QualityProvider({ children }: { children: React.ReactNode }) {
  const reducedMotion = useQualityStore((state) => state.reducedMotion);
  const quality = useQualityStore((state) => state.quality);

  useEffect(() => {
    const store = useQualityStore.getState();
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    store.setReducedMotion(media.matches);
    const onChange = (event: MediaQueryListEvent) => store.setReducedMotion(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const available = webglAvailable();
    useQualityStore.getState().setWebglAvailable(available);

    void (async () => {
      const { saveData, slow } = connectionQuality();
      const nav = navigator as Navigator & { deviceMemory?: number };
      const gpu = await probeGpu();
      if (cancelled) return;

      const guess = detectQuality({
        cores: navigator.hardwareConcurrency ?? 4,
        memory: nav.deviceMemory ?? 4,
        tier: gpu.tier,
        isMobile: gpu.mobile || isMobileViewport(),
        saveData,
        slowConnection: slow,
        webglAvailable: available,
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });

      if (!useQualityStore.getState().manual) useQualityStore.setState({ quality: guess });

      const fps = await measureFps();
      if (cancelled) return;
      useQualityStore.setState({ fps });

      const current = useQualityStore.getState();
      if (!current.manual) {
        const demoted: Quality =
          fps < 42 ? (current.quality === "high" ? "medium" : "low") : current.quality;
        if (demoted !== current.quality) useQualityStore.setState({ quality: demoted });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Espejo en el DOM: CSS y fallback leen de acá (sin re-render de React).
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.quality = quality;
    if (reducedMotion) root.dataset.reducedMotion = "true";
  }, [quality, reducedMotion]);

  return <>{children}</>;
}

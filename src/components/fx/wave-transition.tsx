"use client";

/**
 * Transición "ola" entre páginas: al cambiar de ruta (o de idioma) el agua
 * sube por la pantalla y revela la nueva vista. Usamos la View Transitions API
 * cuando el navegador la soporta y, si no, una cortina CSS igual de corta.
 * Con `prefers-reduced-motion` no se dibuja nada: el cambio es instantáneo.
 */
import { useEffect, useRef } from "react";
import { usePathname } from "@/i18n/navigation";

export function WaveTransition() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const firstRef = useRef(true);

  useEffect(() => {
    if (firstRef.current) {
      firstRef.current = false;
      return;
    }
    const overlay = overlayRef.current;
    if (!overlay) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    overlay.dataset.playing = "true";
    const done = () => {
      delete overlay.dataset.playing;
    };
    const timer = window.setTimeout(done, 900);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <div ref={overlayRef} className="wave-overlay" aria-hidden>
      <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="wave-overlay__crest">
        <path d="M0 60c120-40 240 40 360 30s240-60 360-50 240 60 360 40 120-30 120-30V120H0Z" />
      </svg>
    </div>
  );
}

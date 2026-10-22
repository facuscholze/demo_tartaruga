"use client";

/**
 * Superficie del cielo. Dos capas, una por capacidad:
 *  1. Degradé CSS con `@property` + sol y estrellas (SIEMPRE: es el contenido
 *     esencial y el fallback de tier low / reduced-motion / sin WebGL).
 *  2. Shader WebGL encima (solo high/medium), montado bajo demanda.
 *
 * Si el shader falla, se desmonta y el degradé queda solo: nunca hay pantalla
 * negra ni hero vacío.
 */
import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { useQualitySettings } from "@/features/quality/store";
import { usePointerSky } from "@/hooks/use-pointer-sky";
import { cn } from "@/lib/utils";

const SkyCanvasLazy = lazy(() =>
  import("@/features/three/sky-canvas").then((module) => ({ default: module.SkyCanvas })),
);

class WebGLBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch() {
    this.props.onError();
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function SkySurface({ className, children }: { className?: string; children?: ReactNode }) {
  const settings = useQualitySettings();
  const [webglFailed, setWebglFailed] = useState(false);
  usePointerSky(true);

  const showWebgl = settings.webgl && !webglFailed;

  // Fuerza el degradé CSS como fondo mientras el shader se compila.
  useEffect(() => {
    document.documentElement.dataset.skyMode = showWebgl ? "webgl" : "css";
  }, [showWebgl]);

  return (
    <div
      className={cn("absolute inset-0 overflow-clip bg-[var(--sky-mid)]", className)}
      aria-hidden="true"
    >
      <div className="sky-gradient absolute inset-0" data-sky-css />
      <div className="sky-stars" />
      {showWebgl ? (
        <Suspense fallback={null}>
          <WebGLBoundary onError={() => setWebglFailed(true)}>
            <SkyCanvasLazy quality={settings.quality} />
          </WebGLBoundary>
        </Suspense>
      ) : null}
      {/* Overlay de legibilidad: el texto siempre tiene contraste sobre cielos claros. */}
      <div className="absolute inset-0 sky-veil" />
      {children}
    </div>
  );
}

"use client";

/**
 * Capa de fuego. Tres niveles, mismo efecto emocional:
 *  - high/medium → partículas GPU (se montan solo cuando la sección entra en
 *    pantalla, y se desmontan al salir).
 *  - low / reduced-motion → dos brasas CSS que respiran (`.fire-ember`), que
 *    además laten con el audio si está prendido en cualquier tier.
 */
import { Component, Suspense, lazy, type ReactNode } from "react";
import { useQualitySettings } from "@/features/quality/store";
import { cn } from "@/lib/utils";

const FireStageLazy = lazy(() =>
  import("@/features/three/fire-stage").then((m) => ({ default: m.FireStage })),
);

class Boundary extends Component<
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

export function FireCanvas({ className }: { className?: string }) {
  const settings = useQualitySettings();
  const useWebgl = settings.webgl && settings.particleCount > 0;

  return (
    <div className={cn("pointer-events-none", className)} aria-hidden="true">
      <div className="fire-ember" />
      <div className="fire-ember" data-layer="2" />
      {useWebgl ? (
        <Suspense fallback={null}>
          <Boundary onError={() => {}}>
            <FireStageLazy quality={settings.quality} />
          </Boundary>
        </Suspense>
      ) : null}
    </div>
  );
}

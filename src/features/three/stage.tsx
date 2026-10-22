"use client";

/**
 * Wrapper de React Three Fiber con las reglas del proyecto:
 *  - El `frameloop` se corta a `"never"` cuando la sección no está visible o la
 *    pestaña pasa a segundo plano: 0% de CPU y batería en reposo.
 *  - `dpr` limitado por el tier de calidad (high 2, medium 1.35, low 1).
 *  - Nunca se monta antes de que la sección esté cerca del viewport
 *    (lo decide `LazySection`, y Three nunca entra en el bundle inicial).
 */
import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Quality } from "@/features/quality/tiers";

const DPR_CAP: Record<Quality, number> = { high: 2, medium: 1.35, low: 1 };

export function Stage({
  children,
  quality,
  className,
  gl,
  camera,
  onReady,
}: {
  children: ReactNode;
  quality: Quality;
  className?: string;
  gl?: { antialias?: boolean; alpha?: boolean; depth?: boolean; stencil?: boolean };
  camera?: { position?: [number, number, number]; fov?: number };
  onReady?: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    let inView = true;
    let visible = document.visibilityState === "visible";
    const sync = () => setActive(inView && visible);

    const observer = new IntersectionObserver(
      (entries) => {
        inView = entries.some((entry) => entry.isIntersecting);
        sync();
      },
      { rootMargin: "160px" },
    );
    observer.observe(node);
    const onVisibility = () => {
      visible = document.visibilityState === "visible";
      sync();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div ref={wrapRef} className={className} data-active={active} aria-hidden="true">
      <Canvas
        dpr={DPR_CAP[quality]}
        frameloop={active ? "always" : "never"}
        flat
        gl={{
          antialias: quality === "high" && gl?.antialias !== false,
          alpha: gl?.alpha ?? true,
          depth: gl?.depth ?? false,
          stencil: gl?.stencil ?? false,
          powerPreference: "high-performance",
        }}
        camera={camera}
        onCreated={({ gl: renderer }) => {
          renderer.setClearAlpha(0);
          onReady?.();
        }}
      >
        {children}
      </Canvas>
    </div>
  );
}

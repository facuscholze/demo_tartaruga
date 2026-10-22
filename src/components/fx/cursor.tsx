"use client";

/**
 * Cursor propio (solo desktop con puntero fino): una gota discreta que se
 * agranda y cambia de etiqueta según el contexto (`data-cursor="ver |
 * arrastrar | reservar"` en el elemento bajo). El cursor nativo NO se oculta
 * globalmente: se oculta solo donde hay un `[data-cursor]`, así los formularios
 * nunca quedan sin cursor.
 */
import { useEffect, useRef, useState } from "react";

const LABELS: Record<string, string> = { ver: "ver", arrastrar: "arrastrar", reservar: "reservar" };

export function CustomCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"idle" | keyof typeof LABELS>("idle");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const node = ref.current;
    if (!node) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;
    let frame = 0;

    const loop = () => {
      x += (targetX - x) * 0.18;
      y += (targetY - y) * 0.18;
      node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      frame = requestAnimationFrame(loop);
    };

    const onMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      if (!ready) setReady(true);
      const element = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-cursor]");
      const next = (element?.dataset.cursor as keyof typeof LABELS | undefined) ?? "idle";
      setMode((current) => (current === next ? current : next));
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    frame = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, [ready]);

  return (
    <div ref={ref} className="tart-cursor" data-mode={mode} aria-hidden="true" style={{ opacity: ready ? 1 : 0 }}>
      <span className="tart-cursor__dot" />
      <span className="tart-cursor__label">{mode === "idle" ? "" : LABELS[mode]}</span>
    </div>
  );
}

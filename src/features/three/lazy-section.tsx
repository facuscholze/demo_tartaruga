"use client";

/**
 * Monta el contenido (WebGL) solo cuando la sección entra en el área de
 * interés, y lo desmonta al salir si `unload` es `true`. Es la regla del brief:
 * Three nunca va en el bundle inicial y nada renderiza fuera de pantalla.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";

export function LazySection({
  children,
  rootMargin = "320px",
  unload = false,
  fallback = null,
  enabled = true,
}: {
  children: ReactNode;
  rootMargin?: string;
  unload?: boolean;
  fallback?: ReactNode;
  enabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const node = ref.current;
    if (!node) return;
    // Si el navegador no tiene IO (raro), montamos igual: el fallback vive debajo.
    if (typeof IntersectionObserver === "undefined") {
      setMounted(true);
      setSeen(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        if (visible) {
          setMounted(true);
          setSeen(true);
        } else if (unload) setMounted(false);
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, rootMargin, unload]);

  return (
    <div ref={ref} data-webgl-mounted={mounted} style={{ display: "contents" }}>
      {mounted ? children : seen && !unload ? null : fallback}
    </div>
  );
}

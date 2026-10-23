"use client";

/**
 * Progreso de scroll 0..1 de un elemento, escrito en un ref (no en state).
 * Es la fuente del "tint" del cielo y del crecimiento del fuego: por frame no
 * puede re-renderizar React.
 */
import { useEffect, type RefObject } from "react";
import { setScrollTint } from "@/features/sky/bus";

export function useScrollTint(ref: RefObject<HTMLElement | null>, multiplier = 1) {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const total = Math.max(1, window.innerHeight * 1.1);
      const progress = Math.min(1, Math.max(0, -rect.top / total));
      setScrollTint(progress * multiplier);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref, multiplier]);
}

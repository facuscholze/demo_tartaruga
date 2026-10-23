"use client";

/**
 * Arrastrar con el mouse sobre un strip horizontal, con inercia al soltar.
 * En touch NO interceptamos nada: el scroll nativo con `scroll-snap` se siente
 * mejor y no pelea con el gesto del navegador (ni con Lenis).
 */
import { useEffect, type RefObject } from "react";
import { clamp, isMobileViewport } from "@/lib/utils";

export function useDragScroll(ref: RefObject<HTMLElement | null>, enabled = true) {
  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled || isMobileViewport()) return;

    let dragging = false;
    let pointerId = -1;
    let startX = 0;
    let startScroll = 0;
    let lastX = 0;
    let velocity = 0;
    let raf = 0;
    let moved = 0;

    const stop = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        velocity *= 0.92;
        node.scrollLeft -= velocity;
        if (Math.abs(velocity) > 0.4) stop();
      });
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      dragging = true;
      pointerId = event.pointerId;
      startX = lastX = event.clientX;
      startScroll = node.scrollLeft;
      velocity = 0;
      moved = 0;
      cancelAnimationFrame(raf);
      node.dataset.dragging = "true";
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== pointerId) return;
      const dx = event.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      velocity = event.clientX - lastX;
      lastX = event.clientX;
      node.scrollLeft = startScroll - dx;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== pointerId) return;
      dragging = false;
      delete node.dataset.dragging;
      // Limitamos la inercia para que nunca vuele 3 pantallas por un swipe corto.
      velocity = clamp(velocity, -40, 40);
      stop();
    };

    // Si el click fue parte de un arrastre, no hay que abrir el lightbox.
    const onClickCapture = (event: MouseEvent) => {
      if (moved > 6) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    node.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    node.addEventListener("click", onClickCapture, true);
    return () => {
      node.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      node.removeEventListener("click", onClickCapture, true);
      cancelAnimationFrame(raf);
    };
  }, [ref, enabled]);
}

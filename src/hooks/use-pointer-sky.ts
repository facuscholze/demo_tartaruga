"use client";

/**
 * Puntero / giroscopio → `skyBus`. Escrito con `passive` + rAF: no genera
 * re-renders ni work en el hilo principal por cada evento.
 */
import { useEffect } from "react";
import { skyBus } from "@/features/sky/bus";

export function usePointerSky(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    let x = 0.5;
    let y = 0.5;

    const apply = () => {
      skyBus.pointerX = x;
      skyBus.pointerY = y;
      document.documentElement.style.setProperty("--pointer-x", x.toFixed(3));
      document.documentElement.style.setProperty("--pointer-y", y.toFixed(3));
      frame = 0;
    };

    const onMove = (event: PointerEvent) => {
      x = event.clientX / Math.max(1, window.innerWidth);
      y = event.clientY / Math.max(1, window.innerHeight);
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const onTilt = (event: DeviceOrientationEvent) => {
      // El giro del celular mueve el sol y el reflejo apenas 3%.
      const gamma = event.gamma ?? 0;
      const beta = event.beta ?? 0;
      x = 0.5 + Math.max(-1, Math.min(1, gamma / 45)) * 0.5;
      y = 0.5 + Math.max(-1, Math.min(1, (beta - 45) / 45)) * 0.5;
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const fine = window.matchMedia("(pointer: fine)").matches;
    window.addEventListener("pointermove", onMove, { passive: true });
    if (!fine && typeof DeviceOrientationEvent !== "undefined") {
      window.addEventListener("deviceorientation", onTilt, { passive: true });
    }
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("deviceorientation", onTilt);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [enabled]);
}

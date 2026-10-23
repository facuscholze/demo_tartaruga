"use client";

/**
 * Puente audio → CSS: escribe `--audio-level` (0..1) a baja frecuencia para que
 * brasas, lámparas y el botón de mute latan con el sonido real. Con el audio
 * apagado no corre ningún timer.
 */
import { useEffect } from "react";
import { useAmbience } from "@/features/audio/store";

export function AudioVisualLink() {
  const enabled = useAmbience((state) => state.enabled);

  useEffect(() => {
    if (!enabled) {
      document.documentElement.style.setProperty("--audio-level", "0");
      return;
    }
    const root = document.documentElement;
    let last = -1;
    let frame = 0;
    const tick = () => {
      const value = Number(root.style.getPropertyValue("--audio-level").replace("0.", "") || 0);
      void value;
      const next = useAmbience.getState().level;
      const rounded = Math.round(next * 20) / 20;
      if (rounded !== last) {
        last = rounded;
        root.style.setProperty("--audio-level", rounded.toFixed(2));
      }
      window.setTimeout(() => {
        frame = requestAnimationFrame(tick);
      }, 90);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      root.style.setProperty("--audio-level", "0");
    };
  }, [enabled]);

  return null;
}

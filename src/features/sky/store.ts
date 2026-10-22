/**
 * Estado del cielo. El store guarda MODO y elevación; el estado de color se
 * deriva con `skyFor()` para que shader, CSS y fallback nunca se desincronicen.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SkyMode, TimeOfDay } from "./palettes";

export type SkyStore = {
  mode: SkyMode;
  /** Elevación solar real (grados) medida en `at`. */
  elevation: number;
  azimuth: number;
  /** Offset de elevación que agrega el scroll (baja el sol al entrar en la noche). */
  scrollOffset: number;
  setMode: (mode: SkyMode) => void;
  cycleMode: () => void;
  setRealSun: (elevation: number, azimuth: number) => void;
  setScrollOffset: (offset: number) => void;
};

const MODES: SkyMode[] = ["auto", "morning", "afternoon", "sunset", "night"];

export const useSkyStore = create<SkyStore>()(
  persist(
    (set, get) => ({
      mode: "auto",
      elevation: 0.4,
      azimuth: 252,
      scrollOffset: 0,
      setMode: (mode) => set({ mode }),
      cycleMode: () => {
        const index = MODES.indexOf(get().mode);
        set({ mode: MODES[(index + 1) % MODES.length]! });
      },
      setRealSun: (elevation, azimuth) =>
        set((state) =>
          state.mode === "auto" ? { elevation, azimuth } : { elevation, azimuth },
        ),
      setScrollOffset: (offset) => set({ scrollOffset: offset }),
    }),
    {
      name: "tartaruga-sky",
      // Solo la preferencia del visitante: el sol real se recalcula siempre.
      partialize: (state) => ({ mode: state.mode }) as Partial<SkyStore>,
    },
  ),
);

export const TOD_LABEL_KEY: Record<TimeOfDay | "auto", string> = {
  auto: "auto",
  morning: "morning",
  afternoon: "afternoon",
  sunset: "sunset",
  night: "night",
};

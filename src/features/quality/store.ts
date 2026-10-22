import { create } from "zustand";
import { persist } from "zustand/middleware";
import { settingsFor, webglAvailable, type Quality, type QualitySettings } from "./tiers";

export type QualityStore = {
  quality: Quality;
  manual: boolean;
  webglAvailable: boolean;
  fps: number | null;
  reducedMotion: boolean;
  /** Sección con canvas WebGL visible: si es `false`, se pausa el render. */
  sceneActive: boolean;
  setQuality: (quality: Quality, manual?: boolean) => void;
  cycleQuality: () => void;
  setFps: (fps: number) => void;
  setReducedMotion: (value: boolean) => void;
  setWebglAvailable: (value: boolean) => void;
  setSceneActive: (value: boolean) => void;
};

const ORDER: Quality[] = ["high", "medium", "low"];

export const useQualityStore = create<QualityStore>()(
  persist(
    (set, get) => ({
      // Arrancamos conservadores: medium sin WebGL hasta medir.
      quality: "medium",
      manual: false,
      webglAvailable: true,
      fps: null,
      reducedMotion: false,
      sceneActive: true,
      setQuality: (quality, manual = true) => set({ quality, manual }),
      cycleQuality: () => {
        const index = ORDER.indexOf(get().quality);
        set({ quality: ORDER[(index + 1) % ORDER.length]!, manual: true });
      },
      setFps: (fps) => set({ fps }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setWebglAvailable: (value) => set({ webglAvailable: value }),
      setSceneActive: (value) => set({ sceneActive: value }),
    }),
    {
      name: "tartaruga-quality",
      partialize: (state) => ({ quality: state.quality, manual: state.manual }),
    },
  ),
);

export function useQualitySettings(): QualitySettings {
  const quality = useQualityStore((state) => state.quality);
  const reducedMotion = useQualityStore((state) => state.reducedMotion);
  const available = useQualityStore((state) => state.webglAvailable);
  const settings = settingsFor(quality, reducedMotion);
  return available ? settings : { ...settings, webgl: false, photoDistortion: false, particleCount: 0 };
}

/** Toggle "Efectos: Max / Normal / Mínimo". */
export const QUALITY_OPTIONS = ORDER;
export { webglAvailable };

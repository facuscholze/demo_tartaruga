import { create } from "zustand";
import { ambience, type AmbienceLayer } from "./engine";
import { skyBus } from "@/features/sky/bus";

/**
 * Estado global del ambiente sonoro. `enabled` recién puede pasar a `true`
 * desde un gesto (el botón "Entrar con sonido" del intro, o el toggle).
 */
export type AmbienceStore = {
  enabled: boolean;
  /** Arrancó el AudioContext (distingue "pediste sonido" de "hay sonido"). */
  started: boolean;
  volume: number;
  layers: Record<AmbienceLayer, boolean>;
  level: number;
  enable: (volume?: number) => Promise<void>;
  disable: () => void;
  toggle: () => void;
  setVolume: (value: number) => void;
  toggleLayer: (layer: AmbienceLayer) => void;
  suspendForBackground: () => void;
  resumeFromBackground: () => void;
};

export const useAmbience = create<AmbienceStore>()((set, get) => ({
  enabled: false,
  started: false,
  volume: 0.45,
  layers: { olas: true, fuego: true, brisa: true },
  level: 0,

  async enable(volume = get().volume) {
    const ok = await ambience.start(volume);
    if (!ok) return;
    const { layers } = get();
    (Object.keys(layers) as AmbienceLayer[]).forEach((layer) =>
      ambience.setLayer(layer, layers[layer]),
    );
    set({ enabled: true, started: true, volume });
    startLevelLoop();
  },

  disable() {
    ambience.stop();
    stopLevelLoop();
    skyBus.audioLevel = 0;
    set({ enabled: false, started: false, level: 0 });
  },

  toggle() {
    if (get().enabled) get().disable();
    else void get().enable();
  },

  setVolume(value) {
    ambience.setVolume(value);
    set({ volume: value });
  },

  toggleLayer(layer) {
    const layers = { ...get().layers, [layer]: !get().layers[layer] };
    ambience.setLayer(layer, layers[layer]!);
    set({ layers });
  },

  suspendForBackground() {
    if (get().enabled) ambience.suspend();
  },

  resumeFromBackground() {
    if (get().enabled) void ambience.start(get().volume);
  },
}));

/* -------------------------------------------------------------------------- */
/* Analizador: 1 loop de rAF que alimenta `skyBus.audioLevel` (fuego y luces   */
/* laten con el sonido). Se corta solo cuando no hay audio y cuando la pestaña */
/* está en segundo plano, así no consume nada estando en silencio.             */
/* -------------------------------------------------------------------------- */

let loopId: number | null = null;

function startLevelLoop() {
  if (loopId !== null) return;
  const tick = () => {
    const state = useAmbience.getState();
    if (!state.enabled || document.visibilityState !== "visible") {
      loopId = null;
      return;
    }
    const level = ambience.readLevel();
    skyBus.audioLevel = skyBus.audioLevel * 0.72 + level * 0.28;
    if (Math.abs(level - state.level) > 0.01) useAmbience.setState({ level });
    loopId = requestAnimationFrame(tick);
  };
  loopId = requestAnimationFrame(tick);
}

function stopLevelLoop() {
  if (loopId !== null) cancelAnimationFrame(loopId);
  loopId = null;
}

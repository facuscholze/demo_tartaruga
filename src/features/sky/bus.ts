/**
 * "Bus" mutable del cielo, a propósito FUERA de React.
 *
 * Los valores que cambian por frame (puntero, giroscopio, progreso de scroll,
 * nivel de audio) no pueden vivir en el store: re-renderizar React 60 veces por
 * segundo anula el objetivo de 60 fps. El shader lee de acá en `useFrame`; el
 * CSS se actualiza a baja frecuencia desde `SkyRoot`.
 */
import type { UniformValues } from "./palettes";

export type SkyBus = {
  pointerX: number;
  pointerY: number;
  scrollT: number;
  audioLevel: number;
  time: number;
};

export const skyBus: SkyBus = {
  pointerX: 0.5,
  pointerY: 0.5,
  scrollT: 0,
  audioLevel: 0,
  time: 0,
};

export function setPointer(x: number, y: number) {
  skyBus.pointerX = x;
  skyBus.pointerY = y;
}

export function setScrollTint(t: number) {
  skyBus.scrollT = Math.min(1, Math.max(0, t));
}

/** Estado "crudo" que el shader lee por frame. Lo escribe `SkyRoot` (baja frecuencia). */
export type SkyInputs = {
  uniforms: UniformValues | null;
  elevation: number;
  azimuth: number;
};

export const skyInputs: SkyInputs = { uniforms: null, elevation: 0.4, azimuth: 252 };

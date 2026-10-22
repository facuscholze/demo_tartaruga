/**
 * Motor del cielo. Idea central: TODO el sitio depende de un solo número, la
 * **elevación solar** en Punta Colorada (grados sobre/bajo el horizonte), más
 * el azimut para la posición horizontal del sol. De ahí se derivan:
 *
 *   - los colores del degradé (CSS `--sky-*`),
 *   - los uniforms del shader (misma tabla, mismo orden: nada duplicado),
 *   - el contraste del texto (`luma` → `data-sky-bright`),
 *   - la intensidad del fuego y de las estrellas.
 *
 * El selector manual (Mañana/Tarde/Atardecer/Noche) finge la elevación, así la
 * demo puede mostrarse completa a cualquier hora real.
 */

export type SkyKeyframe = {
  /** Elevación solar en grados (negativo = sol bajo el horizonte). */
  elevation: number;
  top: string;
  mid: string;
  low: string;
  horizon: string;
  sun: string;
  sea: string;
  /** 0 = noche cerrada, 1 = mediodía. Decide si el texto va claro u oscuro. */
  luma: number;
  /** Radio del disco solar en unidades de pantalla. */
  sunSize: number;
  stars: number;
  warm: number;
};

/** Tabla de referencia: 8 keyframes del día en la costa de Punta Colorada. */
export const SKY_KEYFRAMES: SkyKeyframe[] = [
  {
    elevation: -20,
    top: "#070c18",
    mid: "#0d1428",
    low: "#141d36",
    horizon: "#1e2a4a",
    sun: "#243356",
    sea: "#0a1020",
    luma: 0.04,
    sunSize: 0,
    stars: 1,
    warm: 0.05,
  },
  {
    elevation: -7,
    top: "#0d1530",
    mid: "#1c2650",
    low: "#3d2b53",
    horizon: "#6a3a46",
    sun: "#8a4a3c",
    sea: "#151d38",
    luma: 0.1,
    sunSize: 0.02,
    stars: 0.72,
    warm: 0.3,
  },
  {
    elevation: -1.6,
    top: "#16213f",
    mid: "#43264c",
    low: "#a44233",
    horizon: "#e07a3a",
    sun: "#ffcf8a",
    sea: "#3a2340",
    luma: 0.22,
    sunSize: 0.075,
    stars: 0.18,
    warm: 0.85,
  },
  {
    elevation: 0.6,
    top: "#1b2a55",
    mid: "#b4432e",
    low: "#e4703a",
    horizon: "#f5a94b",
    sun: "#ffe7b8",
    sea: "#7a3350",
    luma: 0.3,
    sunSize: 0.095,
    stars: 0.04,
    warm: 1,
  },
  {
    elevation: 5,
    top: "#2a4a78",
    mid: "#c96a3a",
    low: "#eba157",
    horizon: "#ffd9a0",
    sun: "#fff3d4",
    sea: "#4a5d80",
    luma: 0.52,
    sunSize: 0.06,
    stars: 0,
    warm: 0.82,
  },
  {
    elevation: 16,
    top: "#2f6d9e",
    mid: "#79aec8",
    low: "#dcd9c2",
    horizon: "#f3e7cd",
    sun: "#fffaf0",
    sea: "#5f8ba4",
    luma: 0.78,
    sunSize: 0.038,
    stars: 0,
    warm: 0.4,
  },
  {
    elevation: 40,
    top: "#2c74ab",
    mid: "#83bcd4",
    low: "#e6e8e2",
    horizon: "#f6f0e6",
    sun: "#ffffff",
    sea: "#6ba0b8",
    luma: 0.95,
    sunSize: 0.03,
    stars: 0,
    warm: 0.16,
  },
  {
    elevation: 62,
    top: "#2a7fb8",
    mid: "#8fc9dd",
    low: "#eef0ea",
    horizon: "#fbf7ee",
    sun: "#ffffff",
    sea: "#74aec4",
    luma: 1,
    sunSize: 0.028,
    stars: 0,
    warm: 0.08,
  },
];

export type TimeOfDay = "morning" | "afternoon" | "sunset" | "night";
export type SkyMode = TimeOfDay | "auto";

/** Elevation "fingida" para el selector manual de la demo. */
export const TOD_ELEVATION: Record<TimeOfDay, { elevation: number; azimuth: number }> = {
  morning: { elevation: 16, azimuth: 95 },
  afternoon: { elevation: 41, azimuth: 300 },
  sunset: { elevation: 0.4, azimuth: 252 },
  night: { elevation: -14, azimuth: 250 },
};

export type SkyState = {
  top: string;
  mid: string;
  low: string;
  horizon: string;
  sun: string;
  sea: string;
  luma: number;
  sunSize: number;
  stars: number;
  warm: number;
  /** Elevación efectiva (grados) y azimut (grados, 0=N, 90=E, 180=S, 270=O). */
  elevation: number;
  azimuth: number;
  /** 0..1: cuánta brasa hay prendida (sube cuando el sol baja). */
  fire: number;
  bright: boolean;
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  return [
    parseInt(full.slice(0, 2), 16) / 255,
    parseInt(full.slice(2, 4), 16) / 255,
    parseInt(full.slice(4, 6), 16) / 255,
  ];
}

function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  // Mezcla en luz lineal: los degradés de atardecer no se "ganan" en gris.
  const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const toSrgb = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
  const ch = (x: number, y: number) =>
    Math.round(clamp(toSrgb(toLinear(x) + (toLinear(y) - toLinear(x)) * t), 0, 1) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${ch(r1, r2)}${ch(g1, g2)}${ch(b1, b2)}`;
}

/** Interpola la tabla de keyframes por elevación solar. */
export function skyFor(elevationDeg: number, azimuthDeg: number): SkyState {
  const frames = SKY_KEYFRAMES;
  const e = clamp(elevationDeg, frames[0]!.elevation, frames[frames.length - 1]!.elevation);

  let index = 0;
  while (index < frames.length - 1 && e > frames[index + 1]!.elevation) index += 1;
  const a = frames[index]!;
  const b = frames[Math.min(index + 1, frames.length - 1)]!;
  const span = b.elevation - a.elevation || 1;
  const t = clamp((e - a.elevation) / span, 0, 1);
  const eased = t * t * (3 - 2 * t); // smoothstep: el cambio de color no es lineal

  const mixNum = (x: number, y: number) => x + (y - x) * eased;

  return {
    top: mix(a.top, b.top, eased),
    mid: mix(a.mid, b.mid, eased),
    low: mix(a.low, b.low, eased),
    horizon: mix(a.horizon, b.horizon, eased),
    sun: mix(a.sun, b.sun, eased),
    sea: mix(a.sea, b.sea, eased),
    luma: mixNum(a.luma, b.luma),
    sunSize: mixNum(a.sunSize, b.sunSize),
    stars: mixNum(a.stars, b.stars),
    warm: mixNum(a.warm, b.warm),
    elevation: elevationDeg,
    azimuth: azimuthDeg,
    // Fuego: 0 a pleno día, 1 en la noche. Empieza a crecer en la hora dorada.
    fire: clamp(1 - (elevationDeg + 3) / 15, 0, 1),
    bright: mixNum(a.luma, b.luma) > 0.6,
  };
}

/** Posición del disco en la pantalla: sale por el Este, se pone al Oeste. */
export function sunPosition(elevationDeg: number, azimuthDeg: number) {
  const up = clamp(elevationDeg / 62, -0.35, 1);
  const x = clamp((azimuthDeg - 60) / 240, -0.15, 1.15); // 60° (NE) → 300° (NO)
  return { x, y: 0.86 - up * 0.72 };
}

export type UniformNumber = number;
export type UniformColor = [number, number, number];

/** Mismo estado, formato uniforms GLSL (así el shader y el CSS no divergen). */
export function skyUniforms(state: SkyState) {
  const rgb = (hex: string): UniformColor => hexToRgb(hex);
  const pos = sunPosition(state.elevation, state.azimuth);
  return {
    uSkyTop: rgb(state.top),
    uSkyMid: rgb(state.mid),
    uSkyLow: rgb(state.low),
    uSkyHorizon: rgb(state.horizon),
    uSunColor: rgb(state.sun),
    uSeaColor: rgb(state.sea),
    uSunPos: [pos.x, pos.y] as [UniformNumber, UniformNumber],
    uSunSize: state.sunSize,
    uStars: state.stars,
    uWarm: state.warm,
    uFire: state.fire,
  };
}

export type UniformValues = ReturnType<typeof skyUniforms>;

/** Variables CSS que se inyectan en `<html>` (fallback sin WebGL y acentos). */
export function skyCssVars(state: SkyState): Record<string, string> {
  const pos = sunPosition(state.elevation, state.azimuth);
  return {
    "--sky-top": state.top,
    "--sky-mid": state.mid,
    "--sky-low": state.low,
    "--sky-horizon": state.horizon,
    "--sky-sun": state.sun,
    "--sky-sea": state.sea,
    "--sky-luma": state.luma.toFixed(3),
    "--sky-warm": state.warm.toFixed(3),
    "--sun-x": pos.x.toFixed(3),
    "--sun-y": pos.y.toFixed(3),
    "--star-opacity": state.stars.toFixed(3),
    "--fire-intensity": state.fire.toFixed(3),
  };
}

/** Degradé CSS: se usa en tier Low y como base del hero (mejora progresiva). */
export function skyGradient(state: SkyState): string {
  return `linear-gradient(to bottom, ${state.top} 0%, ${state.mid} 34%, ${state.low} 62%, ${state.horizon} 78%, ${state.sea} 100%)`;
}

/** Etiqueta legible para `aria-live` y el chip de "hora del día". */
export function skyLabel(elevationDeg: number): "noche" | "alba" | "manana" | "tarde" | "golden" | "atardecer" | "crepusculo" {
  if (elevationDeg < -7) return "noche";
  if (elevationDeg < -0.8) return "crepusculo";
  if (elevationDeg < 6) return "golden";
  if (elevationDeg < 24) return "manana";
  return "tarde";
}

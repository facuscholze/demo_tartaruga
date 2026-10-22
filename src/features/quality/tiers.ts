/**
 * Sistema de calidad adaptativa. High / Medium / Low.
 *
 * Se decide con 4 señales: GPU (detect-gpu), `hardwareConcurrency`,
 * `deviceMemory` y FPS REAL medido los primeros segundos. El resultado vive en
 * `localStorage` y en `<html data-quality>`, así la siguiente visita arranca ya
 * ajustada (sin parpadeo de efectos).
 */
import { getGPUTier } from "detect-gpu";

export type Quality = "high" | "medium" | "low";

export const QUALITY_LABELS: Record<Quality, { es: string; en: string }> = {
  high: { es: "Max", en: "Max" },
  medium: { es: "Normal", en: "Normal" },
  low: { es: "Mínimo", en: "Minimal" },
};

export type QualitySettings = {
  quality: Quality;
  webgl: boolean;
  /** Resolución del render de shaders (devicePixelRatio efectivo). */
  pixelRatio: number;
  particleCount: number;
  photoDistortion: boolean;
  heatHaze: boolean;
  grain: boolean;
  parallax: boolean;
  audioAnalyser: boolean;
  maxFps: number;
};

export function settingsFor(quality: Quality, reducedMotion: boolean): QualitySettings {
  const base: QualitySettings = {
    quality,
    webgl: true,
    pixelRatio: 2,
    particleCount: 900,
    photoDistortion: true,
    heatHaze: true,
    grain: true,
    parallax: true,
    audioAnalyser: true,
    maxFps: 60,
  };
  if (reducedMotion) {
    // Reduced motion: sin loops continuos. El cielo queda en su estado actual.
    return { ...base, quality: "low", webgl: false, particleCount: 0, photoDistortion: false, heatHaze: false, grain: false, parallax: false, maxFps: 30 };
  }
  if (quality === "medium") {
    return { ...base, pixelRatio: 1.35, particleCount: 380, photoDistortion: true, heatHaze: false, audioAnalyser: false };
  }
  if (quality === "low") {
    return { ...base, webgl: false, photoDistortion: false, heatHaze: false, pixelRatio: 1, particleCount: 0, audioAnalyser: false, grain: false, maxFps: 30 };
  }
  return base;
}

export type DetectInput = {
  cores: number;
  memory: number;
  tier: "low" | "mid" | "high" | "none";
  isMobile: boolean;
  saveData: boolean;
  slowConnection: boolean;
  webglAvailable: boolean;
  reducedMotion: boolean;
};

/** Reglas transparentes (sin caja negra): se documentan en CLAUDE.md. */
export function detectQuality(input: DetectInput): Quality {
  if (input.reducedMotion) return "low";
  if (!input.webglAvailable || input.saveData) return "low";
  if (input.slowConnection) return "low";

  const good = input.tier === "high";
  const bad = input.tier === "none" || input.tier === "low";
  if (input.isMobile) {
    if (good && input.cores >= 6 && input.memory >= 6) return "high";
    if (bad || input.cores <= 4) return "low";
    return "medium";
  }
  if (bad || input.cores <= 4) return "medium";
  return "high";
}

/** `detect-gpu` devuelve un número 0..3 (0 = sin GPU / no soportado). */
export async function probeGpu(): Promise<{ tier: "low" | "mid" | "high" | "none"; mobile: boolean }> {
  try {
    const info = await getGPUTier({ failIfMajorPerformanceCaveat: true });
    const tier = info.tier >= 3 ? "high" : info.tier === 2 ? "mid" : info.tier === 1 ? "low" : "none";
    return { tier, mobile: Boolean(info.isMobile) };
  } catch {
    return { tier: "none", mobile: false };
  }
}

export function webglAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") ?? canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl")),
    );
  } catch {
    return false;
  }
}

export function connectionQuality(): { saveData: boolean; slow: boolean } {
  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  return {
    saveData: Boolean(connection?.saveData),
    slow: /(^|-)2g$/.test(connection?.effectiveType ?? "") || connection?.effectiveType === "slow-2g",
  };
}

type NetworkInformationLike = { saveData?: boolean; effectiveType?: string };

/** FPS medido en los primeros ~2.2s de vida de la página. */
export function measureFps(durationMs = 2200): Promise<number> {
  return new Promise((resolve) => {
    let frames = 0;
    let start = 0;
    const step = (time: number) => {
      if (!start) start = time;
      frames += 1;
      if (time - start >= durationMs) {
        resolve(Math.round((frames * 1000) / (time - start)));
        return;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

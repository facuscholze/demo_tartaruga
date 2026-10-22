/** `cn` sin dependencias: junta clases y deja que Tailwind resuelva el orden. */
export function cn(...inputs: Array<string | false | null | undefined>): string {
  return inputs.filter(Boolean).join(" ");
}

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 47.99rem)").matches || navigator.maxTouchPoints > 1;
}

/** Números "humanos" para etiquetas de precio/contador sin saltos de layout. */
export function tabular(value: string): string {
  return value;
}

/**
 * Convenciones de nombres de archivo. Uso compartido entre la app (runtime)
 * y los scripts de contenido (build/CLI), para que la regla sea una sola.
 */

/** `Milanesa a la Navaja.JPG` → `milanesa-a-la-navaja.jpg` */
export function normalizeFilename(input: string): string {
  const cleaned = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // tildes y diacríticos
    .toLowerCase()
    .trim()
    .replace(/&/g, "-y-")
    .replace(/['`´]/g, "")
    .replace(/[()[\]{}]/g, "")
    .replace(/[^a-z0-9.\s_-]+/g, "-")
    .replace(/[\s_]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  return cleaned;
}

/** Mismo criterio pero para ids/slug. */
export function normalizeId(input: string): string {
  const base = normalizeFilename(input).replace(/\.(jpg|jpeg|png|webp|avif|svg)$/i, "");
  return base.length > 0 ? base : "sin-nombre";
}

export function hasValidName(input: string): boolean {
  return /^[a-z0-9][a-z0-9._-]*$/.test(input);
}

export function nameProblems(input: string): string[] {
  const problems: string[] = [];
  if (input !== input.toLowerCase()) problems.push("tiene mayúsculas");
  if (/\s/.test(input)) problems.push("tiene espacios");
  if (input.normalize("NFD") !== input.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
    problems.push("tiene tildes o diacríticos");
  if (/[_]/.test(input)) problems.push("usa _ (usá -)");
  if (/[^a-z0-9.\s_-]/.test(input)) problems.push("tiene caracteres no permitidos");
  if (/^[-.]/.test(input)) problems.push("empieza con - o .");
  return problems;
}

/** Distancia de Levenshtein para sugerir el nombre más parecido. */
export function distance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j]! + 1,
        cur[j - 1]! + 1,
        prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[n]!;
}

/** Mejor candidato según similitud (prefix del nombre base + extensión distinta cuentan). */
export function suggestName(target: string, candidates: string[]): string | undefined {
  const base = target.replace(/\.[a-z]+$/i, "");
  let best: { name: string; score: number } | undefined;
  for (const c of candidates) {
    const cBase = c.replace(/\.[a-z]+$/i, "");
    const score = Math.min(distance(base, cBase), distance(target, c)) - (cBase === base ? 1 : 0);
    if (!best || score < best.score) best = { name: c, score };
  }
  return best && best.score <= Math.max(3, Math.ceil(base.length / 3)) ? best.name : undefined;
}

export const IMAGE_EXT_RE = /\.(jpe?g|png|webp|avif|svg)$/i;
export function stripExt(name: string): string {
  return name.replace(IMAGE_EXT_RE, "");
}

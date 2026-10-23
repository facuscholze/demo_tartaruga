/**
 * Selección de idioma para objetos `{ es, en?, pt? }`.
 * Regla del brief: si falta la traducción, se muestra `es` (nunca un hueco).
 */
export type L10nValue = { es: string; en?: string; pt?: string };

export function pickText(value: L10nValue | undefined, locale: string): string {
  if (!value) return "";
  const key = locale as keyof L10nValue;
  const candidate = value[key];
  if (typeof candidate === "string" && candidate.trim().length > 0) return candidate;
  return value.es ?? "";
}

/** `true` si la traducción de `locale` falta (lo usa `content:check` para avisar). */
export function isMissingTranslation(value: L10nValue | undefined, locale: string): boolean {
  if (!value) return false;
  if (locale === "es") return !value.es?.trim();
  const candidate = value[locale as keyof L10nValue];
  return typeof candidate !== "string" || candidate.trim().length === 0;
}

/** Título de un plato/categoría ya resuelto. */
export type LocalizedText = { es: string; en?: string; pt?: string };

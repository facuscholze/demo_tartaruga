export { normalizeId } from "../../src/lib/naming";

/** `pulpo a la parrilla` → `Pulpo a la parrilla` (para nombres generados). */
export function titleCase(input: string): string {
  const value = input.trim();
  if (value.length === 0) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

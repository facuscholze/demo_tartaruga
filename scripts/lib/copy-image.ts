/** Copia una foto del usuario a la carpeta del módulo con nombre normalizado. */
import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { IMAGES_DIR } from "./content";
import { normalizeFilename } from "../../src/lib/naming";
import type { ImageModule } from "../../src/features/content/schema";

const VALID = /\.(jpe?g|png|webp|avif)$/i;

export type Copied = { filename: string; path: string; skipped: boolean; bytes: number };

export function copyIntoModule(mod: ImageModule, source: string, preferred?: string): Copied | { error: string } {
  if (!source) return { error: "sin archivo" };
  const path = source.replace(/^~/, process.env.HOME ?? "");
  if (!existsSync(path)) return { error: `no existe el archivo: ${path}` };
  if (!VALID.test(extname(path))) return { error: "formato no soportado (jpg, jpeg, png, webp, avif)" };

  const filename = normalizeFilename(preferred ? `${preferred}${extname(path)}` : basename(path));
  if (!VALID.test(extname(filename))) return { error: `el nombre normalizado quedó inválido: "${filename}"` };

  const dir = join(IMAGES_DIR, mod);
  mkdirSync(dir, { recursive: true });
  const target = join(dir, filename);
  const skipped = existsSync(target) && statSync(target).size === statSync(path).size;
  if (!skipped) copyFileSync(path, target);
  return { filename, path: target, skipped, bytes: statSync(target).size };
}

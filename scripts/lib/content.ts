/**
 * Helpers compartidos por los scripts de contenido (`pnpm content:*`, `add:*`).
 * Sin dependencias de Next: corren igual en local y en CI.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { basename, extname, join, relative, sep } from "node:path";
import { contentFiles, imageModuleDir, type ImageModule } from "../../src/features/content/schema";

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(HERE, "..", "..");
export const CONTENT_DIR = join(ROOT, "content");
export const IMAGES_DIR = join(ROOT, "public", "images");

export const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".svg"] as const;
/** Umbral de peso y ancho mínimo, según el brief. */
export const MAX_BYTES = 500 * 1024;
export const MIN_WIDTH = 800;

export type Problem = {
  level: "error" | "warning";
  file: string;
  where: string;
  message: string;
  hint?: string;
};

export function problems() {
  const list: Problem[] = [];
  return {
    list,
    error(file: string, where: string, message: string, hint?: string) {
      list.push({ level: "error", file, where, message, hint });
    },
    warn(file: string, where: string, message: string, hint?: string) {
      list.push({ level: "warning", file, where, message, hint });
    },
    errors: () => list.filter((p) => p.level === "error"),
    warnings: () => list.filter((p) => p.level === "warning"),
  };
}

export function readJsonRaw(
  file: string,
): { ok: true; data: unknown } | { ok: false; message: string } {
  const path = join(CONTENT_DIR, file);
  if (!existsSync(path)) return { ok: false, message: `no existe content/${file}` };
  try {
    return { ok: true, data: JSON.parse(readFileSync(path, "utf8")) as unknown };
  } catch (error) {
    return {
      ok: false,
      message: `JSON mal formado: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export function writeFileJson(file: string, data: unknown): void {
  const path = join(CONTENT_DIR, basename(file));
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

/** Imágenes existentes por módulo (sin incluir `_fallback` ni el manifiesto). */
export function listModuleImages(mod: ImageModule): string[] {
  const dir = join(IMAGES_DIR, imageModuleDir[mod]);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => IMAGE_EXTS.includes(extname(f).toLowerCase() as never));
}

export function fileBytes(path: string): number {
  return existsSync(path) ? statSync(path).size : 0;
}

/** Dimensiones de una imagen: sharp si está disponible, fallback a null. */
export async function imageDimensions(
  path: string,
): Promise<{ width: number; height: number } | null> {
  if (extname(path).toLowerCase() === ".svg") return null;
  try {
    const sharp = (await import("sharp")).default;
    const meta = await sharp(path).metadata();
    if (!meta.width || !meta.height) return null;
    return { width: meta.width, height: meta.height };
  } catch {
    return null;
  }
}

export function relFromRoot(path: string): string {
  return relative(ROOT, path).split(sep).join("/");
}

/** Todos los nombres de imagen declarados en los JSON, con su ubicación legible. */
export type ImageRef = {
  mod: ImageModule;
  filename: string;
  file: string;
  where: string;
  /** `true` si viene de la convención por `id` (campo `image` ausente). */
  implied?: boolean;
};

export function collectImageRefs(
  data: Record<string, unknown>,
  file: string,
  mod: ImageModule,
): ImageRef[] {
  const refs: ImageRef[] = [];
  const cat = file === "menu.json" ? "categories" : undefined;

  const push = (filename: unknown, where: string) => {
    if (typeof filename === "string" && filename.length > 0) {
      refs.push({ mod, filename, file, where });
    }
  };

  if (file === "menu.json") {
    const categories = Array.isArray(data["categories"])
      ? (data["categories"] as Record<string, unknown>[])
      : [];
    categories.forEach((category, ci) => {
      const cid = String(category["id"] ?? `#${ci + 1}`);
      push(category["icon"], `${cid}.icon (carpeta icons)`);
      const items = Array.isArray(category["items"])
        ? (category["items"] as Record<string, unknown>[])
        : [];
      items.forEach((item, ii) => {
        const iid = String(item["id"] ?? `#${ii + 1}`);
        if (item["image"]) push(item["image"], `${cid} › ${iid}.image`);
        else
          refs.push({
            mod,
            filename: `${iid}.<cualquiera>`,
            file,
            where: `${cid} › ${iid}`,
            implied: true,
          });
      });
    });
  } else if (file === "gallery.json") {
    const items = Array.isArray(data["items"]) ? (data["items"] as Record<string, unknown>[]) : [];
    items.forEach((item, i) => push(item["image"], `items[${i}].image`));
  } else if (file === "experiences.json") {
    const items = Array.isArray(data["items"]) ? (data["items"] as Record<string, unknown>[]) : [];
    items.forEach((item, i) => {
      const id = String(item["id"] ?? `#${i + 1}`);
      push(item["image"], `${id}.image`);
      push(item["icon"], `${id}.icon (carpeta icons)`);
    });
  } else if (file === "promos.json") {
    const items = Array.isArray(data["promos"])
      ? (data["promos"] as Record<string, unknown>[])
      : [];
    items.forEach((item, i) => push(item["image"], `promos[${i}].image`));
  } else if (file === "site.json") {
    // site.json no referencia fotos de contenido (solo links externos).
    void cat;
  }
  return refs;
}

export function contentFileNames(): string[] {
  return contentFiles.map((c) => c.file);
}

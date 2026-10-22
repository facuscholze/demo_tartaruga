/**
 * Resolución de imágenes por NOMBRE DE ARCHIVO.
 *
 * El contenido solo guarda `"pulpo-parrilla.jpg"`. Acá se decide la carpeta:
 *   módulo `menu` → `/images/menu/pulpo-parrilla.jpg`
 * Si el campo `image` no existe, se busca por convención un archivo con el
 * mismo nombre que el `id` (cualquier extensión válida). Si tampoco está, se
 * usa el fallback visual (degradé de atardecer + caracola grabada): nunca un
 * hueco vacío.
 *
 * El manifiesto (`public/images/_manifest.json`, generado por
 * `pnpm content:optimize` con sharp) aporta dimensiones reales y un
 * `blurDataURL` para que el LCP no tenga saltos de layout. Si no existe, se
 * usan defaults y el sitio sigue funcionando igual.
 */
import "server-only";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { imageModuleDir, type ImageModule, IMAGE_EXTENSIONS } from "./schema";
import { stripExt } from "@/lib/naming";

const PUBLIC_IMAGES_ROOT = join(process.cwd(), "public", "images");
const MANIFEST_PATH = join(PUBLIC_IMAGES_ROOT, "_manifest.json");

export type GeneratedMeta = { width: number; height: number; blur?: string };
export type ImageManifest = Record<string, GeneratedMeta>;

let listings: Record<string, string[]> | null = null;
let manifest: ImageManifest | null | undefined;

/** Listado por módulo, cacheado por build. */
function readListings(): Record<string, string[]> {
  if (listings) return listings;
  const out: Record<string, string[]> = {};
  for (const mod of Object.keys(imageModuleDir) as ImageModule[]) {
    const dir = join(PUBLIC_IMAGES_ROOT, imageModuleDir[mod]);
    out[mod] = existsSync(dir) ? readdirSync(dir) : [];
  }
  listings = out;
  return out;
}

export function readManifest(): ImageManifest {
  if (manifest !== undefined && manifest !== null) return manifest ?? {};
  try {
    manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as ImageManifest;
  } catch {
    manifest = {};
  }
  return manifest;
}

export function imagesFor(mod: ImageModule): string[] {
  return readListings()[mod] ?? [];
}

/** Ruta pública para un archivo de un módulo (no verifica existencia). */
export function publicPath(mod: ImageModule, filename: string): string {
  return `/images/${imageModuleDir[mod]}/${filename}`;
}

/** ¿Existe el archivo en la carpeta del módulo? (server/build time) */
export function imageExists(mod: ImageModule, filename: string): boolean {
  return imagesFor(mod).includes(filename);
}

/** Candidato por convención `id` → `id.jpg|jpeg|png|webp|avif`. */
function byConvention(mod: ImageModule, id: string): string | undefined {
  const wanted = stripExt(id).toLowerCase();
  return imagesFor(mod).find((f) => {
    const base = stripExt(f).toLowerCase();
    return base === wanted && IMAGE_EXTENSIONS.includes(f.split(".").pop()!.toLowerCase() as never);
  });
}

export type ResolvedImage = {
  /** `undefined` ⇒ usar fallback visual (degradé + caracola). */
  src?: string;
  /** Cómo se resolvió, para debug y para `content:check`. */
  via: "field" | "convention" | "fallback";
  /** Archivo declarado que no existía (para avisos del check). */
  missing?: string;
  width: number;
  height: number;
  blurDataURL?: string;
  isSvg: boolean;
};

const FALLBACK_SIZE = { width: 1200, height: 900 };

export function resolveImage(
  mod: ImageModule,
  opts: { image?: string; id: string },
): ResolvedImage {
  const listing = readManifest();
  const pick = (file: string): ResolvedImage => {
    const meta = listing[`${imageModuleDir[mod]}/${file}`];
    const isSvg = file.endsWith(".svg");
    return {
      src: publicPath(mod, file),
      via: opts.image ? "field" : "convention",
      width: meta?.width ?? FALLBACK_SIZE.width,
      height: meta?.height ?? FALLBACK_SIZE.height,
      blurDataURL: meta?.blur,
      isSvg,
    };
  };

  if (opts.image) {
    if (imageExists(mod, opts.image)) return pick(opts.image);
    // El nombre declarado no existe: probamos convención por id antes de rendirnos.
    const alt = byConvention(mod, opts.id);
    if (alt) return { ...pick(alt), via: "convention", missing: opts.image };
    return { ...fallback(), via: "fallback", missing: opts.image };
  }

  const auto = byConvention(mod, opts.id);
  if (auto) return { ...pick(auto), via: "convention" };
  return fallback();
}

/** Íconos (caracolas grabadas): solo por nombre, con fallback a undefined. */
export function resolveIcon(mod: "icons", name?: string): string | undefined {
  if (!name) return undefined;
  return imageExists(mod, name) ? publicPath(mod, name) : undefined;
}

function fallback(): ResolvedImage {
  return { ...FALLBACK_SIZE, via: "fallback", isSvg: false };
}

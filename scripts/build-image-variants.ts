#!/usr/bin/env tsx
/**
 * `pnpm images:build` — variantes de imagen para un sitio sin servidor.
 *
 * GitHub Pages sirve archivos y punto: no existe `/_next/image`, así que el
 * `srcset` hay que generarlo en build. Este script recorre `public/images/**`
 * (los mismos archivos que referencia el contenido por nombre) y escribe:
 *
 *   public/images/_generated/<módulo>/<nombre>/<ancho>.avif
 *   public/images/_generated/<módulo>/<nombre>/<ancho>.webp
 *   src/generated/image-variants.ts   ← el mapa que consume `ui/media.tsx`
 *
 * El contenido NO cambia: sigue siendo `"pulpo-parrilla.jpg"`. Si falta una
 * variante o el script no corrió, `Media` usa el original y el sitio se ve igual
 * (solo pesa más), así que nada de esto puede romper una build.
 *
 * SVG e íconos se saltan a propósito: ya son vectoriales y chiquitos.
 */
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import sharp from "sharp";
import { IMAGES_DIR, relFromRoot } from "./lib/content";
import { imageModules, imageModuleDir } from "../src/features/content/schema";

const RASTER = /\.(jpe?g|png|webp)$/i;
/** Anchos que tiene sentido servir en un sitio de fotos a pantalla completa. */
const WIDTHS = [640, 960, 1440];
const AVIF_QUALITY = 46;
const WEBP_QUALITY = 74;
/** Por debajo de esto, una variante no vale el viaje de red extra. */
const MIN_USEFUL_BYTES = 12_000;
/** `FORCE_IMAGES=1` borra `_generated/` y re-codifica todo desde cero. */
const FORCE = process.env.FORCE_IMAGES === "1" || process.env.FORCE_IMAGES === "true";

type Entry = { avif?: string; webp?: string; jpg?: string };

async function variantsFor(source: string, outDir: string, widths: number[]) {
  const meta = await sharp(source, { failOn: "none" }).metadata();
  const natural = meta.width ?? 0;
  if (!natural) return undefined;

  const base = basename(source).replace(RASTER, "");
  mkdirSync(outDir, { recursive: true });
  const urls: {
    avif: Record<number, string>;
    webp: Record<number, string>;
    jpg: Record<number, string>;
  } = {
    avif: {},
    webp: {},
    jpg: {},
  };
  const relDir = relFromRoot(outDir).replace(/^public\//, "");

  const fresh = (file: string) =>
    existsSync(file) && statSync(file).mtimeMs >= statSync(source).mtimeMs;

  for (const target of widths.filter((w) => w < natural)) {
    const pipeline = () =>
      sharp(source, { failOn: "none" }).resize({ width: target, withoutEnlargement: true });
    // Cada variante se saltea si ya existe y es más nueva que la fuente: así una
    // tanda nueva de fotos paga solo lo que falta (AVIF es lo caro).
    const encode = async (file: string, run: () => Promise<unknown>) => {
      if (!fresh(file)) await run();
      return file;
    };

    // JPEG de respaldo: solo si el original ya es grande (si no, el original ya sirve).
    if (statSync(source).size > MIN_USEFUL_BYTES * 2) {
      const file = join(outDir, `${base}-${target}.jpg`);
      await encode(file, () =>
        pipeline().jpeg({ quality: 76, mozjpeg: true, progressive: true }).toFile(file),
      );
      urls.jpg[target] = `${relDir}/${base}-${target}.jpg`;
    }
    const webp = join(outDir, `${base}-${target}.webp`);
    await encode(webp, () => pipeline().webp({ quality: WEBP_QUALITY }).toFile(webp));
    urls.webp[target] = `${relDir}/${base}-${target}.webp`;

    const avif = join(outDir, `${base}-${target}.avif`);
    await encode(avif, () => pipeline().avif({ quality: AVIF_QUALITY }).toFile(avif));
    urls.avif[target] = `${relDir}/${base}-${target}.avif`;
  }

  const srcset = (map: Record<number, string>) => {
    const parts = Object.entries(map)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([w, url]) => `${url} ${w}w`);
    return parts.length > 0 ? parts.join(", ") : undefined;
  };

  // El original también entra al srcset, como último escalón (ruta relativa a
  // `public/`, que es lo que entiende el navegador; jamás la ruta del disco).
  const original = relFromRoot(source).replace(/^public\//, "");
  return {
    avif: srcset(urls.avif),
    webp: srcset(urls.webp),
    jpg: [srcset(urls.jpg), `${original} ${natural}w`].filter(Boolean).join(", ") || undefined,
    natural,
  };
}

async function main() {
  const started = Date.now();
  const index: Record<string, Entry> = {};
  const kept = new Set<string>();
  let count = 0;

  // Incremental por default: cada variante se saltea si ya está al día (arriba,
  // por mtime) y al final se reconcilia lo que quedó huérfano. `FORCE_IMAGES=1`
  // borra `_generated/` y re-codifica todo (útil si cambia la paleta de calidades).
  const genRoot = join(IMAGES_DIR, "_generated");
  if (FORCE) rmSync(genRoot, { recursive: true, force: true });

  for (const mod of imageModules) {
    const dir = join(IMAGES_DIR, imageModuleDir[mod]);
    if (!existsSync(dir)) continue;
    for (const filename of readdirSync(dir)) {
      if (!RASTER.test(filename)) continue;
      const source = join(dir, filename);
      const natural = await sharp(source, { failOn: "none" })
        .metadata()
        .then((m) => m.width ?? 0)
        .catch(() => 0);
      if (!natural) continue;
      const widths = WIDTHS.concat(natural).filter((w) => w <= natural);
      const outDir = join(genRoot, imageModuleDir[mod], filename.replace(RASTER, ""));
      const built = await variantsFor(source, outDir, widths);
      if (!built?.webp) {
        rmSync(outDir, { recursive: true, force: true });
        continue;
      }
      const key = `images/${imageModuleDir[mod]}/${filename}`;
      index[key] = { avif: built.avif, webp: built.webp, jpg: built.jpg };
      kept.add(join(genRoot, imageModuleDir[mod], filename.replace(RASTER, "")));
      count += 1;
    }
  }

  if (!FORCE && existsSync(genRoot)) {
    // Cualquier carpeta de variante que ya no corresponda a una foto del repo se va,
    // para que sacar una imagen no deje `.avif` huérfanos en `public/`.
    for (const moduleDir of readdirSync(genRoot, { withFileTypes: true })) {
      if (!moduleDir.isDirectory()) continue;
      const byModule = join(genRoot, moduleDir.name);
      for (const imageDir of readdirSync(byModule, { withFileTypes: true })) {
        const path = join(byModule, imageDir.name);
        if (imageDir.isDirectory() && !kept.has(path))
          rmSync(path, { recursive: true, force: true });
      }
    }
  }

  const body = Object.entries(index)
    .map(
      ([key, value]) =>
        `  ${JSON.stringify(key)}: {\n${Object.entries(value)
          .filter(([, v]) => v)
          .map(([k, v]) => `    ${k}: ${JSON.stringify(v)},`)
          .join("\n")}\n  },`,
    )
    .join("\n");

  writeFileSync(
    join("src", "generated", "image-variants.ts"),
    `/**
 * Mapa de variantes de imagen generadas en build (\`pnpm images:build\`).
 *
 * ⚠️ ARCHIVO GENERADO: no lo edites a mano, se pisa entero en cada corrida.
 * Vive commiteado a propósito para que \`pnpm lint\`, \`pnpm typecheck\` y los tests
 * funcionen sin haber generado nada. Las rutas van SIN \`NEXT_PUBLIC_BASE_PATH\`;
 * el prefijo lo agrega \`withBase()\` en el render, así el mismo mapa sirve para
 * localhost, project pages y dominio propio.
 */
export type ImageVariants = {
  /** \`srcset\` AVIF (mejor compresión, navegador moderno). */
  avif?: string;
  /** \`srcset\` WebP. */
  webp?: string;
  /** \`srcset\` con el original (JPEG/PNG) como respaldo. */
  jpg?: string;
};

const INDEX: Record<string, ImageVariants> = {
${body}
};

/** Normaliza cualquier ruta (con o sin base, con query) a la clave del mapa. */
function keyOf(src: string): string {
  const clean = src.split("?")[0] ?? src;
  const match = /(?:^|\\/)((?:images|audio)\\/.+?)$/.exec(clean);
  return match?.[1] ?? clean;
}

export function variantsFor(src?: string): ImageVariants | undefined {
  if (!src) return undefined;
  return INDEX[keyOf(src)];
}
`,
    "utf8",
  );

  console.info(
    `\n  ✔ Variantes: ${count} imágenes × ${WIDTHS.length} anchos (AVIF + WebP) → ${relFromRoot(genRoot)}`,
  );
  console.info(
    `  ✔ Mapa: src/generated/image-variants.ts (${((Date.now() - started) / 1000).toFixed(1)} s)\n`,
  );
}

void main();

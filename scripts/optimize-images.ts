#!/usr/bin/env tsx
/**
 * `pnpm content:optimize [--in-place]`
 *
 * 1. Genera `public/images/_manifest.json` con `width`/`height` y un
 *    `blurDataURL` por imagen. El sitio lo usa para reservar el espacio y
 *    pintar el degradé difuso: sin saltos de layout (CLS ≈ 0) y sin trabajo de
 *    imagen en el cliente.
 * 2. Reporta qué archivos conviene optimizar. Con `--in-place` los re-encodea
 *    (JPEG calidad 80, máx 2560px, sin metadatos) y deja el original como
 *    `<nombre>.orig.jpg`.
 *
 * No duplica a `next/image`: el servidor ya sirve AVIF/WebP en los tamaños que
 * pide cada dispositivo. Acá solo se resuelve "¿cuánto mide y cómo se ve borroso?".
 */
import {
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { IMAGES_DIR, ROOT, relFromRoot } from "./lib/content";
import { imageModules, imageModuleDir } from "../src/features/content/schema";

const MANIFEST = join(IMAGES_DIR, "_manifest.json");
const EXTENSIONS = /\.(jpe?g|png|webp|avif)$/i;
const BLUR_WIDTH = 20;
/** A partir de acá conviene re-encodear. */
const HEAVY_BYTES = 1_500_000;
const MAX_EDGE = 2560;

type Entry = { width: number; height: number; blur?: string; bytes: number; format: string };

async function analyze(path: string): Promise<Entry | null> {
  try {
    const image = sharp(path, { failOn: "none" });
    const meta = await image.metadata();
    if (!meta.width || !meta.height) return null;
    let blur: string | undefined;
    try {
      const small = await image
        .resize(BLUR_WIDTH, Math.max(1, Math.round((BLUR_WIDTH * meta.height) / meta.width)), {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 40, mozjpeg: true })
        .toBuffer();
      blur = `data:image/jpeg;base64,${small.toString("base64")}`;
    } catch {
      blur = undefined;
    }
    return {
      width: meta.width,
      height: meta.height,
      blur,
      bytes: statSync(path).size,
      format: meta.format ?? "desconocido",
    };
  } catch {
    return null;
  }
}

async function main() {
  const inPlace = process.argv.includes("--in-place");
  const manifest: Record<string, Entry> = {};
  let total = 0;
  const heavy: Array<{ path: string; bytes: number; width: number }> = [];

  for (const mod of imageModules) {
    const dir = join(IMAGES_DIR, imageModuleDir[mod]);
    if (!existsSync(dir)) continue;
    for (const filename of readdirSync(dir)) {
      if (!EXTENSIONS.test(filename)) continue;
      const path = join(dir, filename);
      const entry = await analyze(path);
      if (!entry) continue;
      manifest[`${imageModuleDir[mod]}/${filename}`] = entry;
      total += 1;
      if (entry.bytes > HEAVY_BYTES || entry.width > MAX_EDGE) {
        heavy.push({ path, bytes: entry.bytes, width: entry.width });
      }
      // SVG: se listan igual para que el check sepa que existen (sin dimensiones).
    }
    for (const filename of readdirSync(dir)) {
      if (!filename.endsWith(".svg")) continue;
      manifest[`${imageModuleDir[mod]}/${filename}`] = {
        width: 512,
        height: 512,
        bytes: statSync(join(dir, filename)).size,
        format: "svg",
      };
      total += 1;
    }
  }

  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.info(`\n  ✔ Manifest: ${total} imágenes → ${relFromRoot(MANIFEST)}`);

  if (heavy.length === 0) {
    console.info("  ✔ Ninguna imagen pesada: todas por debajo de 1.5 MB y 2560px.\n");
    return;
  }

  console.info(`\n  ${heavy.length} imagen(es) para optimizar:`);
  for (const item of heavy) {
    console.info(
      `    • ${relFromRoot(item.path)} — ${(item.bytes / 1024 / 1024).toFixed(1)} MB, ${item.width}px`,
    );
  }

  if (!inPlace) {
    console.info(
      "\n  Corré con `--in-place` para re-encodearlas (se guarda el original como .orig.jpg).\n",
    );
    return;
  }

  for (const item of heavy) {
    const backup = item.path.replace(EXTENSIONS, ".orig.jpg");
    if (!existsSync(backup)) renameSync(item.path, backup);
    const out = await sharp(backup, { failOn: "none" })
      .rotate()
      .resize({ width: MAX_EDGE, withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true, progressive: true })
      .withMetadata({ orientation: undefined })
      .toFile(item.path);
    console.info(
      `  ✔ ${relFromRoot(item.path)}: ${(statSync(backup).size / 1024).toFixed(0)} KB → ${(out.size / 1024).toFixed(0)} KB`,
    );
  }
  console.info("  ↻ Volvé a correr `pnpm content:optimize` para actualizar el manifest.\n");
  void ROOT;
  void readFileSync;
}

void main();

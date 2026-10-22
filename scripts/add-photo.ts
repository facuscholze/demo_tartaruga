#!/usr/bin/env tsx
/**
 * `pnpm add:photo` — agrega una foto a la galería: copia el archivo a
 * `public/images/gallery/` y crea la entrada en `content/gallery.json`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CONTENT_DIR } from "./lib/content";
import { ask, askChoice, done, info } from "./lib/prompt";
import { copyIntoModule } from "./lib/copy-image";
import { titleCase } from "./lib/text";
import { gallerySections } from "../src/features/content/schema";

type GalleryItem = Record<string, unknown>;

async function main() {
  const path = join(CONTENT_DIR, "gallery.json");
  const data = JSON.parse(readFileSync(path, "utf8")) as { items: GalleryItem[] };

  info("\n  Alta de foto · content/gallery.json\n");
  const photo = await ask("Ruta de la foto:");
  if (!photo) {
    info("  ✖ Sin archivo, no creo nada.");
    done();
    return;
  }
  const copied = copyIntoModule("gallery", photo);
  if ("error" in copied) {
    info(`  ✖ ${copied.error}`);
    done();
    process.exit(1);
    return;
  }

  const altEs = await ask("Descripción de la foto (alt, obligatorio para accesibilidad):", titleCase(copied.filename.replace(/\.[a-z]+$/i, "")));
  const altEn = await ask("Descripción en inglés (Enter = usa la de español):", "");
  const section = await askChoice("Sección:", [...gallerySections], "lugar");
  const weight = await ask("Peso visual 0–3 (3 = la más grande):", "1");

  data.items.push({
    image: copied.filename,
    alt: { es: altEs, ...(altEn ? { en: altEn } : {}) },
    section,
    weight: Math.max(0, Math.min(3, Number(weight) || 1)),
  });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  info(`\n  ✔ Foto en public/images/gallery/${copied.filename} y entrada agregada (sección ${section}).\n     Validá con \`pnpm content:check\`.\n`);
  done();
}

void main();

#!/usr/bin/env tsx
/**
 * `pnpm add:dish` — alta guiada de un plato (2 minutos, sin tocar código).
 * Pregunta categoría, nombre, precio, descripción e imagen; copia la foto a
 * `public/images/menu/` con nombre normalizado y agrega el producto al JSON.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CONTENT_DIR } from "./lib/content";
import { ask, askChoice, askNumber, askYesNo, done, info } from "./lib/prompt";
import { copyIntoModule } from "./lib/copy-image";
import { normalizeId, titleCase } from "./lib/text";

type Item = Record<string, unknown>;
type Category = { id: string; name: { es: string }; items: Item[] };

async function main() {
  const path = join(CONTENT_DIR, "menu.json");
  const data = JSON.parse(readFileSync(path, "utf8")) as { categories: Category[] };
  const names = data.categories.map((c) => c.name.es);

  info("\n  Alta de plato · content/menu.json\n");
  const categoryName = await askChoice("Categoría:", names, names[0]!);
  const category = data.categories.find((c) => c.name.es === categoryName) ?? data.categories[0]!;

  const nameEs = await ask("Nombre del plato:");
  if (!nameEs) {
    info("  ✖ Sin nombre, no creo nada.");
    done();
    return;
  }
  const nameEn = await ask("Nombre en inglés (Enter = se muestra el español):", "");
  const price = await askNumber("Precio en UYU (0 = Consultar):", 0);
  const descriptionEs = await ask("Descripción corta (Enter = vacía):", "");
  const descriptionEn = await ask("Descripción en inglés (Enter = vacía):", "");
  const photo = await ask("Ruta de la foto (Enter = sin foto, usa fallback):", "");
  const featured = await askYesNo("¿Destacado como recomendado? (s/n):", false);

  const id = normalizeId(nameEs);
  if (category.items.some((item) => item["id"] === id)) {
    info(
      `  ✖ Ya existe un plato con id "${id}" en ${category.name.es}. Cambiá el nombre o editá el JSON.`,
    );
    done();
    process.exit(1);
  }

  const item: Item = {
    id,
    name: { es: nameEs, ...(nameEn ? { en: nameEn } : {}) },
    description: { es: descriptionEs, ...(descriptionEn ? { en: descriptionEn } : {}) },
    price,
    tags: [],
    available: true,
    ...(featured ? { featured: true } : {}),
  };

  if (photo) {
    const copied = copyIntoModule("menu", photo);
    if ("error" in copied) {
      info(`  ⚠ No copié la foto: ${copied.error}. El plato igual se agrega con fallback visual.`);
    } else {
      item["image"] = copied.filename;
      info(
        `  ✔ Foto en public/images/menu/${copied.filename} (${(copied.bytes / 1024).toFixed(0)} KB)`,
      );
    }
  }

  category.items.push(item);
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  info(
    `\n  ✔ Agregué "${nameEs}" a ${category.name.es} (${price > 0 ? `$${price.toLocaleString("es-UY")}` : "Consultar"}).\n` +
      `    Si subiste la foto, corré \`pnpm content:optimize\` para el blur y las dimensiones.\n` +
      `    Validá con \`pnpm content:check\`.\n`,
  );
  void existsSync;
  void titleCase;
  done();
}

void main();

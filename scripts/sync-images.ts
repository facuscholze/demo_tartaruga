#!/usr/bin/env tsx
/**
 * `pnpm content:sync-images [carpeta]`
 * Escanea una carpeta de fotos y crea en el JSON la entrada base por cada
 * archivo que no esté referenciado todavía (id = nombre de archivo).
 * Vos después solo completás nombre y precio.
 *
 *   pnpm content:sync-images                       → escanea public/images/{menu,gallery,experiences,promos}
 *   pnpm content:sync-images ~/Fotos/tartaruga     → copia las fotos a public/images/menu/ y las indexa
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";
import { CONTENT_DIR, IMAGES_DIR } from "./lib/content";
import { normalizeFilename, normalizeId, stripExt } from "../src/lib/naming";

const EXTENSIONS = /\.(jpe?g|png|webp|avif)$/i;

type Module = "menu" | "gallery" | "experiences" | "promos";

const targets: Record<Module, () => { file: string; data: Record<string, unknown> }> = {
  menu: () => ({ file: "menu.json", data: readContent("menu.json") }),
  gallery: () => ({ file: "gallery.json", data: readContent("gallery.json") }),
  experiences: () => ({ file: "experiences.json", data: readContent("experiences.json") }),
  promos: () => ({ file: "promos.json", data: readContent("promos.json") }),
};

function readContent(file: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(CONTENT_DIR, file), "utf8")) as Record<string, unknown>;
}

function collectReferenced(
  data: Record<string, unknown>,
  key: string,
  nestedKey?: string,
): Set<string> {
  const set = new Set<string>();
  if (nestedKey) {
    const groups = Array.isArray(data[nestedKey])
      ? (data[nestedKey] as Record<string, unknown>[])
      : [];
    for (const group of groups) {
      const items = Array.isArray(group[key]) ? (group[key] as Record<string, unknown>[]) : [];
      for (const item of items)
        if (typeof item["image"] === "string") set.add(item["image"] as string);
      if (typeof group["image"] === "string") set.add(group["image"] as string);
    }
  } else {
    const items = Array.isArray(data[key]) ? (data[key] as Record<string, unknown>[]) : [];
    for (const item of items)
      if (typeof item["image"] === "string") set.add(item["image"] as string);
  }
  return set;
}

function titleFrom(filename: string): string {
  const base = stripExt(filename).replace(/[-_]+/g, " ").trim();
  return base.length > 0 ? base.charAt(0).toUpperCase() + base.slice(1) : "Nuevo";
}

function main() {
  const arg = process.argv[2];
  let added = 0;

  if (arg) {
    // Modo "importar carpeta": copia las fotos a public/images/menu/ y las indexa.
    const source = join(arg);
    if (!existsSync(source)) {
      console.error(`\n  ✖ No existe la carpeta ${source}\n`);
      process.exit(1);
    }
    const dir = join(IMAGES_DIR, "menu");
    mkdirSync(dir, { recursive: true });
    const { file, data } = targets.menu();
    const referenced = collectReferenced(data, "items", "categories");
    const firstCategory = (
      Array.isArray(data["categories"]) ? (data["categories"] as Record<string, unknown>[]) : []
    )[0];
    const items =
      firstCategory && Array.isArray(firstCategory["items"])
        ? (firstCategory["items"] as unknown[])
        : [];

    for (const raw of readdirSync(source)) {
      if (!EXTENSIONS.test(raw)) continue;
      const filename = normalizeFilename(raw);
      if (!filename || !EXTENSIONS.test(filename)) continue;
      copyFileSync(join(source, raw), join(dir, filename));
      if (referenced.has(filename)) continue;
      const id = normalizeId(stripExt(filename));
      items.push({
        id,
        name: { es: titleFrom(filename), en: "" },
        description: { es: "", en: "" },
        price: 0,
        image: filename,
        tags: [],
        available: true,
      });
      added += 1;
      console.info(`  + ${filename} → plato "${id}" (completá nombre y precio)`);
    }
    writeFileSync(join(CONTENT_DIR, file), `${JSON.stringify(data, null, 2)}\n`, "utf8");
  } else {
    for (const mod of Object.keys(targets) as Module[]) {
      const dir = join(IMAGES_DIR, mod);
      if (!existsSync(dir)) continue;
      const { file, data } = targets[mod]();
      const referenced = collectReferenced(
        data,
        "items",
        mod === "menu" ? "categories" : undefined,
      );
      const files = readdirSync(dir).filter((f) => EXTENSIONS.test(f));
      const missing = files.filter((f) => !referenced.has(f));
      if (missing.length === 0) {
        console.info(`\n  ✔ ${mod}: las ${files.length} imágenes del módulo están indexadas.`);
        continue;
      }
      console.info(
        `\n  ${mod}: ${missing.length} imagen(es) sin entrada → creando base en ${file}`,
      );
      for (const filename of missing) {
        const id = normalizeId(stripExt(filename));
        const entry = {
          id,
          image: filename,
          name: { es: titleFrom(filename), en: "" },
          description: { es: "", en: "" },
          price: 0,
          tags: [],
          available: true,
        };
        if (mod === "menu") {
          const categories = data["categories"] as Record<string, unknown>[];
          const items = (categories[0]!["items"] ??= []) as unknown[];
          items.push(entry);
        } else if (mod === "promos") {
          const promos = (data["promos"] ??= []) as unknown[];
          promos.push({
            id,
            title: { es: titleFrom(filename), en: "" },
            details: { es: "A confirmar.", en: "" },
            image: filename,
            validFrom: new Date().toISOString().slice(0, 10),
            validUntil: `${new Date().getFullYear()}-12-31`,
            active: true,
            pending: true,
          });
        } else {
          const items = (data["items"] ??= []) as unknown[];
          if (mod === "gallery") {
            items.push({
              image: filename,
              alt: { es: `Foto ${titleFrom(filename)}: describila acá`, en: "" },
              section: "lugar",
              weight: 1,
            });
          } else {
            items.push(entry);
          }
        }
        added += 1;
        console.info(`  + ${filename}`);
      }
      writeFileSync(join(CONTENT_DIR, file), `${JSON.stringify(data, null, 2)}\n`, "utf8");
    }
  }

  console.info(
    added > 0
      ? `\n  ✔ ${added} entrada(s) nueva(s). Recorré ${basename(CONTENT_DIR)}/*.json y completá textos y precios.\n`
      : "\n  ✔ Nada que indexar.\n",
  );
}

void main();

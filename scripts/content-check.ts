#!/usr/bin/env tsx
/**
 * `pnpm content:check` — valida `content/*.json` y las imágenes.
 * Corre en local, en CI y como `prebuild`. Reporta en español.
 *
 * ERRORES (frenan el build): JSON mal formado, campo requerido faltante,
 * precio no numérico, `id` duplicado, imagen referenciada que no existe,
 * nombres con espacios / mayúsculas / tildes.
 * AVISOS (no frenan): imágenes sin usar, fotos pesadas (>500 KB) o chicas
 * (<800 px), productos sin foto (usan fallback), textos sin traducción `en`.
 */
import { join } from "node:path";
import { existsSync } from "node:fs";
import {
  IMAGES_DIR,
  MAX_BYTES,
  MIN_WIDTH,
  collectImageRefs,
  fileBytes,
  imageDimensions,
  listModuleImages,
  problems,
  readJsonRaw,
  relFromRoot,
} from "./lib/content";
import { contentFiles, knownTags, type ImageModule } from "../src/features/content/schema";
import { hasValidName, nameProblems, suggestName, stripExt } from "../src/lib/naming";
import { isMissingTranslation } from "../src/features/content/l10n";

const report = problems();
/** `módulo → nombres usados por los JSON`. */
const used = new Map<ImageModule, Set<string>>();

function markUsed(mod: ImageModule, filename: string) {
  if (!used.has(mod)) used.set(mod, new Set());
  used.get(mod)!.add(filename);
}

/* --------------------------- 1. lectura + Zod ----------------------------- */

type Parsed = { file: string; label: string; mod: ImageModule; data: Record<string, unknown> };
const parsed: Parsed[] = [];

for (const entry of contentFiles) {
  const raw = readJsonRaw(entry.file);
  if (!raw.ok) {
    report.error(
      entry.file,
      "archivo",
      raw.message,
      `creá content/${entry.file} con la estructura del README`,
    );
    continue;
  }
  const result = entry.schema.safeParse(raw.data);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const path = issue.path.join(".") || "(raíz)";
      report.error(entry.file, path, issue.message, suggestForIssue(issue.code, path));
    }
    continue;
  }
  parsed.push({
    file: entry.file,
    label: entry.label,
    mod: entry.module,
    data: raw.data as Record<string, unknown>,
  });
}

function suggestForIssue(code: string, path: string): string | undefined {
  if (code === "invalid_type" && /price/.test(path))
    return 'el precio va como número, sin punto de miles ni texto: "price": 4500 (0 = Consultar)';
  if (code === "unrecognized_keys")
    return "hay una clave que no existe en el esquema: revisá el nombre";
  if (code === "invalid_union" || code === "invalid_date") return "usá formato AAAA-MM-DD";
  return undefined;
}

/* ----------------------- 2. ids duplicados + precios ---------------------- */

for (const { file, data } of parsed) {
  const ids = new Map<string, string>();
  const walk = (node: unknown, where: string) => {
    if (Array.isArray(node)) {
      node.forEach((child, i) => walk(child, `${where}[${i}]`));
      return;
    }
    if (node && typeof node === "object") {
      const record = node as Record<string, unknown>;
      const id = record["id"];
      if (typeof id === "string") {
        const owner = `${where}.id`;
        const seen = ids.get(id);
        if (seen) {
          report.error(
            file,
            owner,
            `el id "${id}" está duplicado (ya usado en ${seen})`,
            "cada id tiene que ser único: los nombres de archivo y los enlaces internos dependen de él",
          );
        } else ids.set(id, owner);
        if (!hasValidName(id)) {
          report.error(
            file,
            owner,
            `el id "${id}" ${nameProblems(id).join(", ")}`,
            `normalizalo a: "${stripExt(id).toLowerCase().replace(/\s+/g, "-")}"`,
          );
        }
      }
      if (
        "price" in record &&
        record["price"] !== undefined &&
        typeof record["price"] !== "number"
      ) {
        report.error(
          file,
          `${where}.price`,
          `el precio tiene que ser un número, y es ${JSON.stringify(record["price"])}`,
          'escribí "price": 4500 (sin "$", sin texto). Si no hay precio, poné 0 o sacá el campo: se muestra "Consultar"',
        );
      }
      if (Array.isArray(record["tags"])) {
        for (const tag of record["tags"] as unknown[]) {
          if (typeof tag !== "string") {
            report.error(
              file,
              `${where}.tags`,
              "las etiquetas tienen que ser textos",
              `ej: ["vegetariano"]`,
            );
          } else if (!knownTags.includes(tag as (typeof knownTags)[number])) {
            report.warn(
              file,
              `${where}.tags`,
              `etiqueta "${tag}" no está en la lista conocida: se muestra tal cual`,
              `etiquetas con etiqueta bonita: ${knownTags.join(", ")}`,
            );
          }
        }
      }
      for (const [key, value] of Object.entries(record)) {
        if (value && typeof value === "object" && !Array.isArray(value))
          walk(value, `${where}.${key}`);
        else if (Array.isArray(value)) walk(value, `${where}.${key}`);
        else if (
          (key === "es" || key === "en" || key === "pt") &&
          where.includes(".") &&
          value === undefined
        ) {
          // nada: Zod ya cubre los obligatorios
        }
      }
    }
  };
  walk(data, file.replace(".json", ""));
}

/* --------------------------- 3. imágenes referenciadas -------------------- */

let usedCount = 0;
for (const { file, mod, data } of parsed) {
  const refs = collectImageRefs(data, file, mod);
  const available = listModuleImages(mod);
  const iconAvailable = listModuleImages("icons");

  for (const ref of refs) {
    const pool = ref.where.includes("icons") ? iconAvailable : available;
    const target = ref.implied ? null : ref.filename;

    if (target) {
      if (!hasValidName(stripExt(target)) || !/^[a-z0-9][a-z0-9._-]*\.[a-z]+$/.test(target)) {
        report.error(
          file,
          ref.where,
          `el nombre de archivo "${target}" no cumple la convención (${nameProblems(target).join(", ") || "extensión inválida"})`,
          pool.includes(target)
            ? "el archivo existe, pero renombralo en minúsculas, sin espacios ni tildes"
            : `ej: "pulpo-parrilla.jpg"`,
        );
      }
      const exists = pool.includes(target);
      if (!exists) {
        const suggestion = suggestName(target, pool);
        report.error(
          file,
          ref.where,
          `la imagen "${target}" no existe en public/images/${mod}/`,
          suggestion
            ? `¿quisiste decir \`${suggestion}\`?`
            : `copiá la foto a public/images/${mod}/ con ese nombre, o sacá el campo`,
        );
      } else {
        usedCount += 1;
        markUsed(mod, target);
      }
    } else {
      // Sin campo `image`: convención por id → si no hay archivo, fallback (aviso).
      const idBase = ref.filename.replace(".<cualquiera>", "");
      const auto = pool.find((f) => stripExt(f).toLowerCase() === idBase.toLowerCase());
      if (auto) {
        usedCount += 1;
        markUsed(mod, auto);
      } else {
        report.warn(
          file,
          ref.where,
          "no tiene foto: se va a usar el fallback visual (degradé de atardecer + caracola)",
          `si querés foto, subí \`${idBase}.jpg\` a public/images/${mod}/ y listo (no hace falta editar el JSON)`,
        );
      }
    }
  }
}

/* --------------------- 4. imágenes huérfanas y de tamaño ------------------ */

let orphanCount = 0;
/** `hero` y `icons` son recursos de diseño: no se reportan como huérfanos. */
const modulesForOrphans: ImageModule[] = ["menu", "gallery", "experiences", "promos"];
const sizeChecks: Array<{ mod: ImageModule; filename: string }> = [];

for (const mod of modulesForOrphans) {
  const all = listModuleImages(mod);
  const usedSet = used.get(mod) ?? new Set<string>();
  for (const filename of all) {
    if (!usedSet.has(filename)) {
      orphanCount += 1;
      report.warn(
        `${mod} (carpeta)`,
        filename,
        `esta imagen no la usa ningún JSON (carpeta public/images/${mod}/)`,
        "referenciala desde el JSON o movela a otra carpeta si es solo un recurso de diseño",
      );
    }
    sizeChecks.push({ mod, filename });
  }
}
for (const { mod, filename } of sizeChecks) {
  const path = join(IMAGES_DIR, mod, filename);
  if (!existsSync(path)) continue;
  const bytes = fileBytes(path);
  if (bytes > MAX_BYTES) {
    report.warn(
      `${mod} (carpeta)`,
      filename,
      `pesa ${(bytes / 1024).toFixed(0)} KB (recomendado < ${MAX_BYTES / 1024} KB)`,
      "corré `pnpm content:optimize` para dejarla lista",
    );
  }
  const dims = await imageDimensions(path);
  if (dims && dims.width < MIN_WIDTH) {
    report.warn(
      `${mod} (carpeta)`,
      filename,
      `mide ${dims.width}px de ancho (recomendado >= ${MIN_WIDTH}px para retina)`,
      undefined,
    );
  }
}

/* ---------------------- 5. textos sin traducir (aviso) -------------------- */

let missingTranslations = 0;
for (const { file, data } of parsed) {
  const walk = (node: unknown, where: string) => {
    if (Array.isArray(node)) return node.forEach((child, i) => walk(child, `${where}[${i}]`));
    if (!node || typeof node !== "object") return;
    const record = node as Record<string, unknown>;
    const isL10n = "es" in record && typeof record["es"] === "string";
    if (isL10n) {
      if (record["es"] && isMissingTranslation(record as never, "en")) {
        missingTranslations += 1;
        report.warn(
          file,
          `${where}.en`,
          'no tiene traducción "en": se muestra el español',
          "completala para que el turista también entienda",
        );
      }
      return;
    }
    for (const [key, value] of Object.entries(record)) walk(value, `${where}.${key}`);
  };
  walk(data, file.replace(".json", ""));
}

/* ------------------------------ 6. resumen ------------------------------- */

const menuData = parsed.find((p) => p.file === "menu.json")?.data as
  { categories?: Array<{ items?: unknown[] }> } | undefined;
const categories = menuData?.categories?.length ?? 0;
const dishes = menuData?.categories?.reduce((sum, c) => sum + (c.items?.length ?? 0), 0) ?? 0;
const galleryCount =
  (parsed.find((p) => p.file === "gallery.json")?.data as { items?: unknown[] } | undefined)?.items
    ?.length ?? 0;
const totalFiles = modulesForOrphans.reduce((n, m) => n + listModuleImages(m).length, 0);

const line = (char: string) => char.repeat(72);
console.info(`\n${line("─")}`);
console.info(`  Contenido de Tartaruga Sea-Bar · ${relFromRoot(IMAGES_DIR)}/`);
console.info(line("─"));

const print = (title: string, items: ReturnType<typeof problems>["list"]) => {
  if (items.length === 0) return;
  console.info(`\n  ${title}`);
  for (const p of items) {
    console.info(`    ${p.level === "error" ? "✖" : "▲"} [${p.file}] ${p.where}`);
    console.info(`      ${p.message}`);
    if (p.hint) console.info(`      → ${p.hint}`);
  }
};

print(`ERRORES (${report.errors().length})`, report.errors());
print(`AVISOS (${report.warnings().length})`, report.warnings());

console.info(`\n${line("─")}`);
console.info(
  [
    `  Categorías: ${categories}`,
    `  Productos:  ${dishes}`,
    `  Fotos de galería: ${galleryCount}`,
    `  Imágenes usadas: ${usedCount} · en disco: ${totalFiles} (huérfanas: ${orphanCount})`,
    `  Textos sin "en": ${missingTranslations}`,
  ].join("\n"),
);
console.info(line("─"));

const errors = report.errors().length;
if (errors > 0) {
  console.error(
    `\n  ${errors} error(es) de contenido. Corregí lo de arriba y volvé a correr:\n    pnpm content:check\n`,
  );
  process.exit(1);
}
console.info("\n  ✔ Contenido OK. El sitio se puede construir.\n");

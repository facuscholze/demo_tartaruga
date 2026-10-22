#!/usr/bin/env tsx
/**
 * `pnpm add:promo` — carga una promo/beneficio en `content/promos.json`.
 * La vigencia se guarda como fecha ISO: al vencer, el bloque se oculta solo.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CONTENT_DIR } from "./lib/content";
import { ask, askYesNo, done, info } from "./lib/prompt";
import { copyIntoModule } from "./lib/copy-image";
import { normalizeId } from "../src/lib/naming";

async function main() {
  const path = join(CONTENT_DIR, "promos.json");
  const data = JSON.parse(readFileSync(path, "utf8")) as { promos: Record<string, unknown>[] };

  info("\n  Alta de promo · content/promos.json\n");
  const title = await ask("Título (ej: Beneficio Scotiabank):");
  if (!title) {
    info("  ✖ Sin título, no creo nada.");
    done();
    return;
  }
  const details = await ask(
    "Detalle / condiciones (texto literal de la gráfica, sin inventar):",
    "",
  );
  const validFrom = await ask("Vigente desde (AAAA-MM-DD):", new Date().toISOString().slice(0, 10));
  const validUntil = await ask("Vigente hasta (AAAA-MM-DD):", `${new Date().getFullYear()}-12-31`);
  const photo = await ask("Ruta de la imagen (Enter = sin imagen):", "");
  const pending = await askYesNo("¿Todavía falta confirmar condiciones con el local? (s/n):", true);

  const id = normalizeId(title);
  const promo: Record<string, unknown> = {
    id,
    order: data.promos.length + 1,
    title: { es: title },
    details: { es: details },
    validFrom,
    validUntil,
    active: true,
    pending,
  };
  if (photo) {
    const copied = copyIntoModule("promos", photo);
    if ("error" in copied) info(`  ⚠ No copié la imagen: ${copied.error}`);
    else promo["image"] = copied.filename;
  }
  data.promos.push(promo);
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  info(
    `\n  ✔ Promo "${title}" cargada (visible del ${validFrom} al ${validUntil}; después se oculta sola).\n     Validá con \`pnpm content:check\`.\n`,
  );
  done();
}

void main();

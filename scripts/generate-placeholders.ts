#!/usr/bin/env tsx
/**
 * `pnpm content:placeholders`
 * Genera una JPG de DEMOSTRACIÓN (degradé de atardecer procedural + marca de
 * agua "PLACEHOLDER") para cada imagen que un JSON referencia pero que todavía
 * no existe en su carpeta. Así la demo se ve completa desde el minuto cero y el
 * cliente solo tiene que REEMPLAZAR el archivo con la foto real (mismo nombre).
 *
 * No pisa archivos existentes: es idempotente y seguro de correr en CI.
 */
import { mkdirSync, existsSync, writeFileSync, readFileSync } from "node:fs";
import { join, extname } from "node:path";
import sharp from "sharp";
import { CONTENT_DIR, IMAGES_DIR } from "./lib/content";
import { contentFiles } from "../src/features/content/schema";
import { collectImageRefsLocal } from "./lib/refs";
import { stripExt } from "../src/lib/naming";

const PALETTES = [
  ["#16213F", "#B4432E", "#E4703A", "#F5A94B"],
  ["#0E1526", "#2A3A63", "#A9422A", "#F2A03D"],
  ["#132043", "#7A3350", "#D4602F", "#FFCE7A"],
  ["#0B1020", "#1E2A4A", "#8C4A2F", "#E9A15B"],
  ["#1B2A55", "#C0563A", "#F2884B", "#EFE3D0"],
];

/** Hash determinista para que cada plato tenga un degradé propio y estable. */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function svgFor(name: string, mod: string): string {
  const seed = hash(`${mod}/${name}`);
  const p = PALETTES[seed % PALETTES.length]!;
  const angle = (seed >> 3) % 60;
  const sunX = 20 + ((seed >> 5) % 60);
  const label = stripExt(name).replace(/-/g, " ").toUpperCase().slice(0, 26);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
<defs>
<linearGradient id="g" gradientTransform="rotate(${45 + angle} .5 .5)">
<stop offset="0" stop-color="${p[0]}"/><stop offset=".45" stop-color="${p[1]}"/>
<stop offset=".75" stop-color="${p[2]}"/><stop offset="1" stop-color="${p[3]}"/>
</linearGradient>
<radialGradient id="s" cx="${sunX}%" cy="74%" r="42%">
<stop offset="0" stop-color="#FFE7B8" stop-opacity=".92"/><stop offset="1" stop-color="#F5A94B" stop-opacity="0"/>
</radialGradient>
<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
<feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".06"/></feComponentTransfer></filter>
</defs>
<rect width="1200" height="900" fill="url(#g)"/><rect width="1200" height="900" fill="url(#s)"/>
<g stroke="#F6F0E6" stroke-opacity=".16" stroke-width="2" fill="none">
${Array.from({ length: 7 }, (_, i) => `<path d="M0 ${120 + i * 118}c120 ${i % 2 ? -26 : 26} 300 ${i % 2 ? 30 : -22} 520 0s420 ${i % 2 ? -30 : 24} 680 ${i % 2 ? 12 : -12}"/>`).join("\n")}
</g>
<rect width="1200" height="900" filter="url(#n)" opacity=".9"/>
<g font-family="monospace" fill="#F6F0E6">
<text x="48" y="80" font-size="22" letter-spacing="6" fill-opacity=".75">${mod.toUpperCase()}</text>
<text x="48" y="118" font-size="34" letter-spacing="2" fill-opacity=".95">${label}</text>
<text x="1152" y="862" text-anchor="end" font-size="19" letter-spacing="4" fill-opacity=".5">PLACEHOLDER · REEMPLAZAR</text>
</g></svg>`;
}

async function main() {
  const modules = ["brand", "hero", "menu", "gallery", "experiences", "promos", "icons"] as const;
  for (const m of modules) mkdirSync(join(IMAGES_DIR, m), { recursive: true });

  let created = 0;
  for (const entry of contentFiles) {
    const path = join(CONTENT_DIR, entry.file);
    if (!existsSync(path)) continue;
    const data = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
    for (const ref of collectImageRefsLocal(data, entry.file, entry.module)) {
      if (ref.implied) continue;
      if (extname(ref.filename).toLowerCase() === ".svg") continue; // los íconos son vectoriales, se crean a mano
      const dir = join(IMAGES_DIR, ref.module);
      const target = join(dir, ref.filename);
      if (existsSync(target)) continue;
      const buffer = await sharp(Buffer.from(svgFor(ref.filename, ref.module)))
        .jpeg({ quality: 62, progressive: true, optimizeCoding: true })
        .toBuffer();
      writeFileSync(target, buffer);
      created += 1;
      console.info(
        `  + public/images/${ref.module}/${ref.filename}  (${(buffer.length / 1024).toFixed(0)} KB)`,
      );
    }
  }
  console.info(
    created > 0
      ? `\n  ${created} placeholder(s) de demo creados. Reemplazalos por las fotos reales con el mismo nombre.\n`
      : "\n  No hace falta crear placeholders: todas las imágenes existen.\n",
  );
}

void main();

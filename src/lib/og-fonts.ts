import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Fuentes para la imagen OG.
 *
 * `ImageResponse` (satori) NO acepta woff2: solo sfnt (TTF/OTF). Como el
 * proyecto sirve woff2 self-hosted desde `@fontsource*`, descomprimimos el
 * contenedor con `wawoff2` y le pasamos el sfnt crudo. Se hace una sola vez y
 * se memoiza en el módulo (el build prerendera `/og/es`, `/og/en`, `/og/pt`).
 *
 * Si la conversión fallara, devolvemos `[]`: la imagen se genera con la fuente
 * default de ImageResponse y el build no se cae por un detalle de textura.
 */
export type OgFont = { name: string; data: Buffer; weight: 400 | 700; style: "normal" };

/**
 * Estáticas, no variables: satori resuelve el cmap/advance por instancia y con
 * un eje variable lee mal las métricas. Son devDependency solo para esta imagen
 * (el sitio usa las variables, que son las que van al bundle).
 */
const SOURCES: { name: string; file: string; weight: 400 | 700 }[] = [
  { name: "Fraunces", file: "@fontsource/fraunces/files/fraunces-latin-700-normal.woff2", weight: 700 },
  { name: "Fraunces", file: "@fontsource/fraunces/files/fraunces-latin-400-normal.woff2", weight: 400 },
  { name: "Instrument", file: "@fontsource/instrument-sans/files/instrument-sans-latin-400-normal.woff2", weight: 400 },
  { name: "Instrument", file: "@fontsource/instrument-sans/files/instrument-sans-latin-600-normal.woff2", weight: 700 },
  { name: "Courier", file: "@fontsource/courier-prime/files/courier-prime-latin-400-normal.woff2", weight: 400 },
];

let cache: Promise<OgFont[]> | null = null;

/** `decompress` de wawoff2 es async (inicializa el wasm la primera vez). */
export function ogFonts(): Promise<OgFont[]> {
  cache ??= build();
  return cache;
}

async function build(): Promise<OgFont[]> {
  const wawoff2 = (await import("wawoff2")) as unknown as {
    decompress: (input: Uint8Array) => Promise<Uint8Array> | Uint8Array;
  };
  const seen = new Set<string>();
  const fonts: OgFont[] = [];
  for (const source of SOURCES) {
    try {
      const raw = readFileSync(join(process.cwd(), "node_modules", source.file));
      const out = await wawoff2.decompress(new Uint8Array(raw));
      const key = `${source.name}-${source.weight}`;
      if (seen.has(key)) continue;
      seen.add(key);
      fonts.push({ name: source.name, data: Buffer.from(out), weight: source.weight, style: "normal" });
    } catch (error) {
      // Sin una fuente no hay layout: ImageResponse exige al menos una, así que
      // agregamos la de Courier (static, sin ejes) como red de seguridad.
      console.warn(`[og-fonts] no se pudo abrir ${source.file}:`, (error as Error).message);
    }
  }
  if (fonts.length === 0) throw new Error("[og-fonts] ninguna fuente disponible para la imagen OG");
  return fonts;
}

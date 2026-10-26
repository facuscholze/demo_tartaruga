import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { absoluteUrl, withBase, withBaseSrcset } from "../src/lib/base";
import { stripBaseAndLocale } from "../src/i18n/use-local-pathname";

/**
 * Auditoría de rutas para el despliegue estático en GitHub Pages.
 *
 * Todo lo que Next no toca (src/srcSet de <img>, url() inline, fetch del audio,
 * manifest, metadata) tiene que pasar por `withBase()`. Este test es la red que
 * evita que se escape un `/repo/repo/images/…` o un `/images/…` sin prefijo:
 * se fija en el código fuente, no en el HTML, así que corre en `pnpm verify`
 * sin necesidad de haber hecho build.
 */

const SRC = "src";
const EXTENSIONS = /\.(ts|tsx)$/;
/** Archivos que SON la capa de prefijado (ahí corresponde ver `/images/…`). */
const PREFIX_LAYER = [
  "src/lib/base.ts",
  "src/features/content/images.ts",
  "src/i18n/use-local-pathname.ts",
];

function filesIn(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return filesIn(path);
    return EXTENSIONS.test(entry) ? [path] : [];
  });
}

const files = filesIn(SRC).filter((file) => !PREFIX_LAYER.includes(file.replace(/\\/g, "/")));

/**
 * Quitamos lo que ya está prefijado (y las llamadas al resolvedor de contenido)
 * para que las reglas busquen SOLO rutas sueltas. No es un parser: es una red de
 * seguridad, y le alcanza para el error real que previene (un literal que se
 * escapó sin `withBase`).
 */
function codeWithoutPrefixing(file: string): string {
  return readFileSync(file, "utf8")
    .replace(/withBase(?:Srcset)?\(\s*["'`][^"'`]*["'`]\s*\)/g, '""')
    .replace(/withBase\(\s*\n?\s*["'`][^"'`]*["'`][^)]*\)/g, '""')
    .replace(/(?:publicPath|resolveImage|resolveIcon)\([^)]*\)/g, '""');
}

const read = (file: string) => codeWithoutPrefixing(file);

describe("rutas de assets bajo el basePath", () => {
  it("no usa next/image (en export no hay optimizador)", () => {
    const offenders = files.filter((file) => /from "next\/image"/.test(read(file)));
    expect(offenders).toEqual([]);
  });

  it('no escribe src="/…" en crudo ni href="/…" en un <a> nativo', () => {
    // `<Link href="/">` sí puede: es el `Link` de next-intl, que agrega el
    // prefijo de idioma y Next le agrega el basePath. Un `<a href="/x">` escapa
    // de ese mecanismo y en Pages queda roto bajo /repo/.
    const offenders = files.filter(
      (file) => /src="\/[^"]*"/.test(read(file)) || /<a[^>]*href="\/[^"]*"/.test(read(file)),
    );
    expect(offenders).toEqual([]);
  });

  it("no hardcodea /images/ o /audio/ fuera de la capa de prefijado", () => {
    const offenders = files
      .map((file) => ({ file, hit: /["'`]\/(images|audio|fonts)\//.test(read(file)) }))
      .filter((entry) => entry.hit);
    expect(offenders).toEqual([]);
  });

  it("no usa next/headers ni next/server (no hay runtime en Pages)", () => {
    const offenders = files.filter((file) => /from "next\/(headers|server)"/.test(read(file)));
    expect(offenders).toEqual([]);
  });

  it("no deja un fetch() a una ruta propia sin prefijar", () => {
    // `fetch("/api/…")` o `fetch("/audio/…")` sin `withBase` mueren bajo /repo/.
    const offenders = files.filter((file) => /fetch\(\s*["'`]\//.test(read(file)));
    expect(offenders).toEqual([]);
  });

  it("el CSS no referencia assets con url(/…)", () => {
    const css = readFileSync(join("src", "app", "globals.css"), "utf8");
    expect(css).not.toMatch(/url\(\s*["']?\//);
  });

  it("no existe proxy.ts ni middleware.ts (Pages no los ejecuta)", () => {
    for (const forbidden of ["src/proxy.ts", "src/middleware.ts", "middleware.ts", "proxy.ts"]) {
      let exists = true;
      try {
        readFileSync(forbidden, "utf8");
      } catch {
        exists = false;
      }
      expect(exists, `${forbidden} no debería existir`).toBe(false);
    }
  });
});

describe("withBase / withBaseSrcset", () => {
  it("es idempotente (con basePath vacío también pasa)", () => {
    expect(withBase(withBase("/images/a.jpg"))).toBe(withBase("/images/a.jpg"));
  });

  it("respeta esquemas y anclas", () => {
    for (const url of [
      "https://x.com/a.jpg",
      "mailto:h@i.io",
      "tel:44321831",
      "#carta",
      "data:image/jpeg;base64,x",
    ]) {
      expect(withBase(url)).toBe(url);
    }
  });

  it("prefija cada término de un srcset", () => {
    const out = withBaseSrcset("images/a-640.avif 640w, images/a-960.avif 960w");
    expect(out).toBe(
      `${withBase("/images/a-640.avif")} 640w, ${withBase("/images/a-960.avif")} 960w`,
    );
    expect(withBaseSrcset(undefined)).toBeUndefined();
  });

  it("absoluteUrl no duplica el prefijo si SITE_URL ya lo trae", () => {
    const one = absoluteUrl("/es/");
    expect(one).not.toMatch(/(\/[^/]+)\/\1\//);
    expect(one.startsWith(absoluteUrl("/"))).toBe(true);
  });
});

describe("stripBaseAndLocale", () => {
  it("devuelve '/' para la página raíz de cualquier despliegue", () => {
    expect(stripBaseAndLocale("/es/")).toBe("/");
    expect(stripBaseAndLocale("/es")).toBe("/");
    // Un segmento que no es idioma no se toca: puede ser parte de la ruta.
    expect(stripBaseAndLocale("/foo/es/")).toBe("/foo/es");
  });

  it("recorta el prefijo de idioma y la barra final", () => {
    expect(stripBaseAndLocale("/pt/carta/")).toBe("/carta");
    expect(stripBaseAndLocale("/en")).toBe("/");
  });
});

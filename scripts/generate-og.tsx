#!/usr/bin/env tsx
/**
 * `pnpm og:build` — imagen social 1200×630 generada EN BUILD (Pages no tiene
 * runtime, así que no puede existir un route handler que la dibuje).
 *
 * Escribe `public/og/<locale>.png`, que Next copia a `out/og/…` y la metadata
 * referencia como `og/<locale>.png` relativo a `metadataBase`. Si el script
 * fallara, la build sigue: la etiqueta OG apunta a un archivo ausente y el card
 * sale con el título y la descripción, que ya es degradation elegante.
 *
 * Composición: la tortuga grabada como marca de agua, el sol asomando bajo el
 * horizonte y el nombre en Fraunces, con un velo oscuro del lado del texto para
 * que el contraste no dependa de la foto.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { ogFonts } from "../src/lib/og-fonts";
import { pickText } from "../src/features/content/l10n";
import { siteSchema } from "../src/features/content/schema";

const SIZE = { width: 1200, height: 630 };
const OUT_DIR = join("public", "og");

/**
 * Se lee el JSON directo (con `readFileSync` + parse) en vez de importar
 * `@/features/content/load`: ese módulo trae `server-only`, que lanza en Node
 * puro. La validación de verdad la hace `pnpm content:check`; acá solo pedimos
 * el shape que usamos.
 */
function readSite() {
  return siteSchema.parse(JSON.parse(readFileSync(join("content", "site.json"), "utf8")));
}

/** Mismo texto que el hero: la bajada del sitio, sin inventar promesas. */
function claimFor(site: ReturnType<typeof siteSchema.parse>, lang: string): string {
  const claim = site.claim && Object.keys(site.claim).length > 0 ? pickText(site.claim, lang) : "";
  return claim || `${site.address.locality.es} · ${site.address.region.es}`;
}

/** Título partido en dos líneas: el nombre y su calificativo, sin desbordar. */
function titleLines(name: string): [string, string] {
  const [first = name, ...rest] = name.split(/\s+/);
  return [first, rest.join(" ")];
}

async function main() {
  const site = readSite();
  const locales = site.i18n.locales.length > 0 ? site.i18n.locales : ["es"];
  const fonts = await ogFonts();
  mkdirSync(OUT_DIR, { recursive: true });

  for (const locale of locales) {
    const [first, second] = titleLines(site.name);

    const image = new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          padding: 70,
          position: "relative",
          backgroundImage:
            "linear-gradient(176deg,#080D18 0%,#0E1526 16%,#16213F 32%,#5E3A5A 55%,#C1553C 74%,#E4703A 87%,#F5A94B 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 40,
            right: -30,
            display: "flex",
            width: 620,
            height: 550,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="620" height="465" viewBox="0 0 240 180" fill="none">
            <g
              stroke="#F6F0E6"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.32"
            >
              <path d="M74.5 67.5C86 40 132 28.5 153 47.5c21 19 18 57-6 71.5-24 14.5-58.5 8-71-14" />
              <path d="M153 47.5c15.5-12.5 34.5-15.5 45.5-7 11 8.5 8.5 23.5-4 29.5-8 4-19.5 4.5-28 3" />
              <path d="M118.5 43.5C113.5 25 126 10 145.5 9.5" />
              <path d="M90.5 119.5C82 138 66 149 49 146.5" />
              <path d="M147 119c8 13.5 22.5 20 37 15.5" />
              <path d="M74.5 104.5C60.5 107 49.5 101 43 90.5" />
              <path d="M101 73.5 121 58.5l21.5 13" strokeWidth="1.4" opacity="0.8" />
              <path d="M96.5 92.5 121 105.5l23-14.5" strokeWidth="1.4" opacity="0.8" />
              <path d="M121 58.5v47" strokeWidth="1.4" opacity="0.6" />
            </g>
            <circle cx="186.5" cy="51.5" r="1.8" fill="#F6F0E6" opacity="0.5" />
          </svg>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: -150,
            left: 430,
            width: 420,
            height: 420,
            borderRadius: 210,
            display: "flex",
            backgroundImage:
              "radial-gradient(circle,#FFCE7A 0%,#F5A94B 42%,rgba(228,112,58,0) 72%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 860,
            height: 630,
            display: "flex",
            backgroundImage:
              "linear-gradient(90deg,rgba(8,13,24,0.72) 0%,rgba(8,13,24,0.46) 52%,rgba(8,13,24,0) 100%)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 22,
            position: "relative",
            maxWidth: 720,
          }}
        >
          <div
            style={{
              display: "flex",
              color: "#FFCE7A",
              fontFamily: "Courier",
              fontSize: 20,
              letterSpacing: "0.22em",
            }}
          >
            {`${site.category.toUpperCase()} · PUNTA COLORADA · MALDONADO`}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              color: "#F6F0E6",
              fontFamily: "Fraunces",
              letterSpacing: "-0.025em",
            }}
          >
            <div style={{ display: "flex", fontSize: 116, lineHeight: 1.02 }}>{first}</div>
            {second ? (
              <div style={{ display: "flex", fontSize: 54, lineHeight: 1.1, opacity: 0.94 }}>
                {second}
              </div>
            ) : null}
          </div>

          <div
            style={{
              display: "flex",
              color: "rgba(246,240,230,0.88)",
              fontFamily: "Instrument",
              fontSize: 30,
              lineHeight: 1.35,
              maxWidth: 620,
            }}
          >
            {claimFor(site, locale)}
          </div>

          <div
            style={{
              display: "flex",
              gap: 34,
              marginTop: 8,
              color: "rgba(246,240,230,0.72)",
              fontFamily: "Courier",
              fontSize: 21,
            }}
          >
            <div style={{ display: "flex" }}>{`RESERVAS · ${site.contact.phoneDisplay}`}</div>
            <div style={{ display: "flex", opacity: 0.8 }}>{site.links.instagramHandle}</div>
          </div>
        </div>
      </div>,
      { ...SIZE, fonts },
    );

    const buffer = Buffer.from(await image.arrayBuffer());
    const file = join(OUT_DIR, `${locale}.png`);
    writeFileSync(file, buffer);
    console.info(
      `  ✔ OG ${locale}: ${file} (${(buffer.length / 1024).toFixed(0)} KB${existsSync(file) ? "" : " ?!"})`,
    );
  }
  console.info("");
}

main().catch((error: unknown) => {
  console.warn("  ▲ No se pudo generar la imagen social:", (error as Error).message);
  console.warn("    El sitio y el build siguen igual; solo el card social sale sin imagen.\n");
});

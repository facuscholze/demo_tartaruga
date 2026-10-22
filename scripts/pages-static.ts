#!/usr/bin/env tsx
/**
 * `pnpm pages:build` — los dos archivos que GitHub Pages necesita y Next no
 * puede generar en modo export, porque no hay servidor que redirija ni 404
 * dinámico. Corre DESPUÉS de `next build` y escribe en `out/`:
 *
 *   out/index.html  → raiz del sitio: elige idioma con `navigator.language`
 *                     (con `<meta http-equiv="refresh">` y links visibles, o sea
 *                     funciona sin JS y con JS roto).
 *   out/404.html    → la tortuga varada en la arena. Pages sirve este archivo
 *                     para cualquier ruta que no exista, incluida una URL que
 *                     solo existe en memoria (deep links de campaña, typos).
 *
 * Ambos son HTML autocontenido con el CSS ya compilado del build en `<link>`
 * relativo, así se ven igual que el sitio sin depender del `basePath` (una
 * ruta relativa desde `/repo/404.html` resuelve `/repo/_next/...` sola).
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { siteSchema } from "../src/features/content/schema";
import { pickText } from "../src/features/content/l10n";
import { routing } from "../src/i18n/routing";

const OUT = "out";
const DEFAULT_LOCALE = routing.defaultLocale;

function cssLinks(): string {
  const dir = join(OUT, "_next", "static", "css");
  if (!existsSync(dir)) return "";
  return readdirSync(dir)
    .filter((f) => f.endsWith(".css"))
    .map((f) => `<link rel="stylesheet" href="_next/static/css/${encodeURIComponent(f)}"/>`)
    .join("\n");
}

/** Tortuga en línea: el 404 no puede esperar a un chunk de JS para existir. */
const TURTLE = `<svg viewBox="0 0 240 180" fill="none" class="turtle" aria-hidden="true">
  <g stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" pathLength="100">
    <path pathLength="100" class="t" d="M74.5 67.5C86 40 132 28.5 153 47.5c21 19 18 57-6 71.5-24 14.5-58.5 8-71-14"/>
    <path pathLength="100" class="t t2" d="M153 47.5c15.5-12.5 34.5-15.5 45.5-7 11 8.5 8.5 23.5-4 29.5-8 4-19.5 4.5-28 3"/>
    <path pathLength="100" class="t t3" d="M118.5 43.5C113.5 25 126 10 145.5 9.5"/>
    <path pathLength="100" class="t t4" d="M90.5 119.5C82 138 66 149 49 146.5"/>
    <path pathLength="100" class="t t5" d="M147 119c8 13.5 22.5 20 37 15.5"/>
    <path pathLength="100" class="t t6" d="M74.5 104.5C60.5 107 49.5 101 43 90.5"/>
  </g>
  <circle cx="186.5" cy="51.5" r="2.2" fill="currentColor"/>
</svg>`;

function head(title: string, description: string): string {
  return `<!doctype html>
<html lang="${DEFAULT_LOCALE}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
<title>${title}</title>
<meta name="description" content="${description}"/>
<meta name="theme-color" content="#0E1526"/>
<meta name="robots" content="noindex,follow"/>
${cssLinks()}
<style>
:root{--ink:#F6F0E6;--dim:rgba(246,240,230,.66);--ember:#F5A94B;--spark:#FFCE7A}
*{box-sizing:border-box}
body{margin:0;min-height:100svh;display:grid;place-items:center;color:var(--ink);
 background:linear-gradient(178deg,#080D18 0%,#0E1526 26%,#16213F 44%,#5E3A5A 66%,#C1553C 84%,#E4703A 100%);
 font-family:var(--font-instrument,system-ui,sans-serif);-webkit-font-smoothing:antialiased;padding:6svh 1.5rem}
main{text-align:center;max-width:34rem;display:grid;gap:1.6rem;justify-items:center}
.turtle{width:min(58vw,15rem);height:auto;color:var(--ink);transform:rotate(180deg);filter:drop-shadow(0 18px 28px rgba(0,0,0,.45))}
.t{stroke-dasharray:100;stroke-dashoffset:100;animation:draw 1.4s cubic-bezier(.16,.84,.24,1) forwards}
.t2{animation-delay:.14s}.t3{animation-delay:.28s}.t4{animation-delay:.42s}.t5{animation-delay:.56s}.t6{animation-delay:.7s}
@keyframes draw{to{stroke-dashoffset:0}}
h1{font-family:var(--font-fraunces,Georgia,serif);font-size:clamp(2.1rem,7vw,3.6rem);line-height:1.05;letter-spacing:-.03em;margin:0}
p{margin:0;color:var(--dim);font-size:1.02rem;line-height:1.6}
.label{font-family:var(--font-courier,"Courier New",monospace);font-size:.7rem;letter-spacing:.2em;text-transform:uppercase;color:var(--spark)}
nav{display:flex;flex-wrap:wrap;gap:.6rem;justify-content:center;margin-top:.4rem}
a.pick{display:inline-block;padding:.72rem 1.15rem;border:1px solid rgba(246,240,230,.28);border-radius:999px;
 color:var(--ink);text-decoration:none;font-family:var(--font-courier,"Courier New",monospace);font-size:.74rem;letter-spacing:.14em;text-transform:uppercase;
 transition:border-color .22s ease,background-color .22s ease}
a.pick:hover{border-color:var(--ember);background:rgba(245,169,75,.14)}
a.pick[data-primary="true"]{background:#E4703A;border-color:#E4703A;color:#2b1005}
@media (prefers-reduced-motion:reduce){.t{animation:none;stroke-dashoffset:0}}
</style>
</head>`;
}

/** Sin `@/features/content/load`: ese módulo trae `server-only` y lanza en Node puro. */
function readSite() {
  return siteSchema.parse(JSON.parse(readFileSync(join("content", "site.json"), "utf8")));
}

function localeLinks(): string {
  // Rutas RELATIVAS: es lo que hace que el archivo sirva igual en `/`, en
  // `/repo/` y en un dominio propio, sin enterarse del basePath en build.
  // El `onclick` guarda la elección en la sesión para que el redirector de la
  // raíz no pelee con lo que el visitante ya eligió.
  return routing.locales
    .map(
      (locale) =>
        `<a class="pick" href="./${locale}/"${locale === DEFAULT_LOCALE ? ' data-primary="true"' : ""}` +
        ` onclick="try{sessionStorage.setItem('tartaruga-locale','${locale}')}catch(e){}">${LABELS[locale] ?? locale}</a>`,
    )
    .join("\n");
}

const LABELS: Record<string, string> = { es: "Español", en: "English", pt: "Português" };

function buildIndex(site: ReturnType<typeof siteSchema.parse>): string {
  const description = (site.seo.description as Record<string, string>)[DEFAULT_LOCALE] ?? "";
  const script = `
<script>
// Elige idioma por navigator.language y reemplaza el historial (no deja la raíz
// en el back). Si el visitante ya eligió, respetamos esa elección de la sesión.
(function(){try{
  var saved="";try{saved=sessionStorage.getItem("tartaruga-locale")||""}catch(e){}
  var locales=${JSON.stringify(routing.locales)},d=${JSON.stringify(DEFAULT_LOCALE)};
  var pick=saved;
  if(!pick){var ls=navigator.languages||[navigator.language||d];
    for(var i=0;i<ls.length;i++){var t=String(ls[i]).slice(0,2).toLowerCase();
      if(locales.indexOf(t)>-1){pick=t;break}}}
  if(!pick)pick=d;
  var dir=location.pathname.replace(/\/[^\/]*$/,"/");
  var want=dir+pick+"/";
  if(pick!==${JSON.stringify(DEFAULT_LOCALE)}&&location.pathname.replace(/\/+$/,"/")!==want){location.replace(want)}
}catch(e){}})();
</script>`;
  return `${head(`${site.name} · ${site.address.locality.es}`, description)}
<body>
<main>
  <p class="label">Punta Colorada · Maldonado · Uruguay</p>
  <h1>${escapeHtml(pickText(site.seo.defaultTitle, DEFAULT_LOCALE))}</h1>
  <p>${escapeHtml(site.claim ? pickText(site.claim, DEFAULT_LOCALE) : "")}</p>
  <nav>
${localeLinks()}
  </nav>
  <p class="label" style="opacity:.62">Elegí idioma · choose a language</p>
</main>
${script}
</body>
</html>
`;
}

function build404(site: ReturnType<typeof siteSchema.parse>): string {
  return `${head(`404 · ${site.name}`, "Página no encontrada")}
<body>
<main>
  ${TURTLE}
  <p class="label">404 · marea alta</p>
  <h1>Te zamarreó la ola</h1>
  <p>Esta página no está (o se la llevó el mar). La carta, los atardeceres y el
  WhatsApp siguen donde siempre.</p>
  <nav>
${localeLinks()}
  </nav>
  <p class="label" style="opacity:.62">Page not found · página não encontrada</p>
</main>
<noscript><p class="label" style="margin-top:1.5rem">Si los botones no te llevan a ningún lado, abrí <a class="pick" href="./es/">/es/</a>.</p></noscript>
</body>
</html>
`;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char,
  );
}

function main() {
  if (!existsSync(OUT)) {
    console.warn("  ▲ No existe out/ todavía; `pages:build` corre DESPUÉS de `next build`.\n");
    return;
  }
  const site = readSite();
  writeFileSync(join(OUT, "index.html"), buildIndex(site), "utf8");
  writeFileSync(join(OUT, "404.html"), build404(site), "utf8");
  // Pages ignora el Jekyll build si está este archivo; sin él, `_next/` puede
  // cortarse por el filtro de guiones bajos.
  writeFileSync(join(OUT, ".nojekyll"), "", "utf8");
  console.info("  ✔ out/index.html (selector de idioma) · out/404.html (tortuga) · out/.nojekyll");
  console.info("");
}

main();

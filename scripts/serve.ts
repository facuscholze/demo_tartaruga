#!/usr/bin/env tsx
/**
 * `pnpm serve` — servidor estático mínimo para probar `out/` como lo vería
 * GitHub Pages, sin depender de `npx serve` (ni de la red).
 *
 * Replica las tres cosas de Pages que importan acá:
 *   · sirve `out/index.html` en la raíz y `out<dir>/index.html` en cada carpeta
 *     (`trailingSlash: true`);
 *   · si `NEXT_PUBLIC_BASE_PATH=/repo`, monta el sitio en `/repo/…`, así se
 *     prueban las rutas prefijadas tal cual;
 *   · cualquier ruta que no existe responde el contenido de `out/404.html` con
 *     status 404, igual que Pages.
 *
 * No es un servidor de producción: sin cache, sin compresión, un solo proceso.
 */
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import type { ServerResponse } from "node:http";

const ROOT = resolve("out");
const BASE = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").trim().replace(/\/+$/, "");
const PORT = Number(process.env.PORT ?? process.argv[2] ?? 3000);

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".xml": "application/xml",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".mp3": "audio/mpeg",
};

function send(status: number, body: Buffer, res: ServerResponse, path = "/") {
  res.writeHead(status, {
    "content-type": TYPES[extname(path)] ?? "application/octet-stream",
    "content-length": String(body.length),
  });
  res.end(body);
}

function readOrNull(path: string): Buffer | null {
  try {
    return statSync(path).isFile() ? readFileSync(path) : null;
  } catch {
    return null;
  }
}

const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? "/").split("?")[0] ?? "/");
  // Fuera del prefijo declarado: 404 como daría Pages en el mismo dominio.
  if (BASE && !url.startsWith(`${BASE}/`) && url !== BASE) {
    const body = readOrNull(join(ROOT, "404.html"));
    if (body) return send(404, body, res, "/404.html");
    res.writeHead(404).end();
    return;
  }
  const rel = normalize(`/${BASE ? url.slice(BASE.length) || "/" : url}`).replace(
    /^([/\\]|\.\.)+/g,
    "/",
  );
  const candidates = [join(ROOT, rel), join(ROOT, rel, "index.html")].filter((p) =>
    p.startsWith(ROOT),
  );
  for (const candidate of candidates) {
    const body = readOrNull(candidate);
    if (body) return send(200, body, res, candidate);
  }
  const notFound = readOrNull(join(ROOT, "404.html"));
  if (notFound) return send(404, notFound, res, "/404.html");
  res.writeHead(404).end("404");
});

if (!existsSync(join(ROOT, "index.html"))) {
  console.error(`\n  ✖ No hay ${join("out", "index.html")}. Corré primero \`pnpm build\`.\n`);
  process.exit(1);
}

server.listen(PORT, "0.0.0.0", () => {
  const prefix = BASE ? BASE : "";
  console.info(
    `\n  ✔ export de Pages en http://localhost:${PORT}${prefix}/  (raíz de out/: ${ROOT})`,
  );
  if (prefix) console.info(`    montado bajo "${prefix}" para simular project pages`);
  console.info(`    probá: ${prefix}/ · ${prefix}/es/ · ${prefix}/ruta-inexistente/ (404.html)\n`);
});

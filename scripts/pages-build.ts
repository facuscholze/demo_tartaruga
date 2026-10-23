#!/usr/bin/env tsx
/**
 * `pnpm build` / `pnpm build:server` — orquestador del build.
 *
 * El orden importa y está explicado en cada paso:
 *   1. `content:optimize` → dimensiones + blur en `public/images/_manifest.json`
 *   2. `content:check`    → portero: un JSON roto frena la build con un mensaje en español
 *   3. `images:build`     → variantes AVIF/WebP + `srcset` (no hay optimizador en Pages)
 *   4. `og:build`         → imagen social estática por idioma
 *   5. `next build`       → export estático (`out/`) o standalone (Vercel/Docker)
 *   6. `pages:build`      → `out/index.html` (selector de idioma) + `out/404.html`
 *
 * Modo `server` salta los pasos 5b/6: con servidor propio Next ya resuelve `/`
 * con el enrutado de idiomas y el 404 con `not-found.tsx`.
 */
import { spawnSync } from "node:child_process";

const mode = process.argv[2] === "server" ? "server" : "pages";
const isWindows = process.platform === "win32";

function run(label: string, args: string[], env: Record<string, string> = {}): void {
  console.info(`\n\u001b[1m▸ ${label}\u001b[0m`);
  const result = spawnSync(isWindows ? "pnpm.cmd" : "pnpm", args, {
    stdio: "inherit",
    env: { ...process.env, ...env },
    shell: false,
  });
  if (result.status !== 0) {
    console.error(`\n\u001b[31m✖ ${label} falló (exit ${result.status ?? "?"}).\u001b[0m`);
    process.exit(result.status ?? 1);
  }
}

run("Optimizando imágenes (manifest + blur)", ["run", "content:optimize"]);
run("Chequeando contenido", ["run", "content:check"]);
run("Generando variantes AVIF/WebP", ["run", "images:build"]);
run("Generando imagen social", ["run", "og:build"]);

if (mode === "server") {
  run("Build de producción (standalone para Vercel/Docker)", ["exec", "next", "build"], {
    SITE_OUTPUT: "server",
  });
} else {
  run("Build de producción (export estático → out/)", ["exec", "next", "build"]);
  run("Escribiendo index.html y 404.html", ["run", "pages:build"]);
}

console.info(
  mode === "server"
    ? "\n\u001b[32m✔ Build server lista (`.next/standalone`).\u001b[0m\n"
    : "\n\u001b[32m✔ Export estático listo en `out/`. Preview: `pnpm serve`\u001b[0m\n",
);

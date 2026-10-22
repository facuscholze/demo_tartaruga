import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** `""` en local/dominio propio, `/demo_tartaruga` en project pages. Ver `src/lib/base.ts`. */
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").trim().replace(/\/+$/, "");

/**
 * Modo servidor (Vercel / Docker / Coolify) vs export estático (GitHub Pages).
 * Pages no ejecuta Node: en export no hay route handlers, ni middleware, ni
 * headers() ni optimizador de imágenes; por eso todo lo demás del proyecto
 * (rutas relativas al `basePath`, `srcset` generado en build, OG estática)
 * funciona IGUAL en los dos modos.
 */
const isStaticExport = process.env.SITE_OUTPUT !== "server";

const nextConfig: NextConfig = {
  output: isStaticExport ? "export" : "standalone",
  trailingSlash: true,
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  // El export no tiene servidor de imágenes: `unoptimized` evita que next/image
  // intente llamar a /_next/image (404 en Pages). Ver `pnpm images:build`.
  images: { unoptimized: true },
  // En export no se puede escribir: que no falle por un `headers()` huérfano.
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["three", "@react-three/drei"],
  },
};

export default withNextIntl(
  withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" })(nextConfig),
);

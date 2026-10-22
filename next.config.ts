import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * Cabeceras de seguridad (CSP razonable: sin 'unsafe-eval', estilos en línea
 * necesarios para motion/next-font, imágenes solo auto/data/blob).
 */
const isDev = process.env.NODE_ENV !== "production";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self' blob: data:",
  "connect-src 'self'" +
    (process.env.BOOKING_WEBHOOK_URL ? ` ${new URL(process.env.BOOKING_WEBHOOK_URL).origin}` : ""),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  isDev ? "" : "upgrade-insecure-requests",
]
  .filter(Boolean)
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // Docker/Coolify: `output: "standalone"` genera un server mínimo autocontenido.
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 420, 540, 640, 750, 828, 1080, 1200, 1600, 1920],
    imageSizes: [48, 96, 160, 240, 320, 480, 640],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    localPatterns: [{ pathname: "/images/**", search: "" }],
  },
  experimental: {
    optimizePackageImports: ["three", "@react-three/drei", "motion", "lucide-react"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // three/R3F no se transpilan: se cargan con dynamic import bajo demanda.
  transpilePackages: [],
};

export default withNextIntl(
  withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" })(nextConfig),
);

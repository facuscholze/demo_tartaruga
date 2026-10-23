import localFont from "next/font/local";

/**
 * Fuentes self-hosted desde los paquetes `@fontsource*`.
 *
 *  - **Fraunces** (display): serif editorial con ejes variables `SOFT`/`WONK`;
 *    el carácter "tallado a mano" que pide la marca, sin ser una serif genérica.
 *  - **Courier Prime** (etiquetas, precios, horarios): máquina de escribir real,
 *    coherente con los highlights del Instagram del local.
 *  - **Instrument Sans** (texto corrido): sans legible y cálida, no Inter.
 *
 * `next/font/local` en vez de `/google`: el sitio no pide nada a un CDN de
 * terceros (menos LCP, CSP estricta, funciona en el VPS). IMPORTANTE: las rutas
 * van como literales — el transform de Next extrae `src` en compile-time y no
 * resuelve si se construyen con una función.
 */
export const fraunces = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-standard-normal.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-standard-italic.woff2",
      weight: "100 900",
      style: "italic",
    },
  ],
  variable: "--font-fraunces",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export const courierPrime = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/courier-prime/files/courier-prime-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/courier-prime/files/courier-prime-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-courier",
  display: "swap",
  fallback: ["Courier New", "monospace"],
});

export const instrumentSans = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2",
      weight: "400 600",
      style: "normal",
    },
  ],
  variable: "--font-instrument",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const fontVariables = `${fraunces.variable} ${courierPrime.variable} ${instrumentSans.variable}`;

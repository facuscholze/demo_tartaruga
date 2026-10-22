/** Tipos globales: elementos intrínsecos de React Three Fiber + imports no JS. */
/// <reference types="node" />

declare module "*.svg" {
  const src: string;
  export default src;
}
declare module "*.glsl" {
  const src: string;
  export default src;
}
declare module "*.glsl.ts" {
  const value: string;
  export default value;
}

/**
 * `wawoff2` se usa solo en build/server para pasar woff2 → sfnt y alimentar la
 * imagen OG (ImageResponse no lee woff2). El paquete no trae tipos.
 */
declare module "wawoff2" {
  export function compress(input: Uint8Array | Buffer | ArrayBuffer): Promise<Uint8Array>;
  export function decompress(input: Uint8Array | Buffer | ArrayBuffer): Promise<Uint8Array>;
}

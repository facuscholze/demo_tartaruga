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

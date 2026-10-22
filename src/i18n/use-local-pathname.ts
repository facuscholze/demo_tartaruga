"use client";

import { useSyncExternalStore } from "react";
import { basePath } from "@/lib/base";
import { routing } from "./routing";

/**
 * Ruta actual SIN `basePath` ni prefijo de idioma, o `null` mientras no haya
 * navegador.
 *
 * Por qué no `usePathname()`: en Next 16 lee de un contexto de enrutador que en
 * el prerender de `output: "export"` viene `null` (no hay request), y la build
 * revienta con `Cannot read properties of null (reading 'pathname')`. Este hook
 * usa `useSyncExternalStore` con snapshot de server = `null`, así que el HTML
 * prerenderado nunca depende de la URL y el cliente se corrige solo al hidratar.
 *
 * En un sitio estático cada idioma es un documento nuevo: la ruta no cambia sin
 * recarga, por eso no hace falta suscribirse al router. Igual escuchamos
 * `popstate` (anclas con hash y el back del navegador).
 */
const listeners = new Set<() => void>();
function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("popstate", onChange);
  };
}

/** Puro y exportado: lo prueban `tests/base-paths.test.ts`. */
export function stripBaseAndLocale(rawPathname: string): string {
  let path = rawPathname;
  if (basePath && (path === basePath || path.startsWith(`${basePath}/`)))
    path = path.slice(basePath.length);
  const [, first, ...rest] = path.split("/");
  if (first && (routing.locales as readonly string[]).includes(first)) path = `/${rest.join("/")}`;
  // `trailingSlash: true` escribe `/es/menu/`; los href localizables van sin barra final.
  const trimmed = path.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function useLocalPathname(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => stripBaseAndLocale(window.location.pathname),
    () => null,
  );
}

"use client";

/**
 * Datos del local disponibles en cliente (links de reserva, coordenadas para
 * el sol, moneda, aviso de demo). El layout los carga una vez desde el JSON y
 * los baja por contexto; ningún componente del cliente lee `content/*.json`.
 * Los helpers de links son puros y viven en `links.ts` para poder usarse
 * también del lado del servidor.
 */
import { createContext, useContext, type ReactNode } from "react";
import { type SiteSnapshot } from "./links";

export type { SiteSnapshot };

const SiteContext = createContext<SiteSnapshot | null>(null);

export function SiteProvider({
  snapshot,
  children,
}: {
  snapshot: SiteSnapshot;
  children: ReactNode;
}) {
  return <SiteContext.Provider value={snapshot}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteSnapshot {
  const value = useContext(SiteContext);
  if (!value) throw new Error("useSite necesita <SiteProvider> en el layout");
  return value;
}

"use client";

/**
 * Aplica el cielo al documento: escribe `--sky-*` en `<html>`, marca el
 * contraste (`data-sky-bright`) y deja el estado listo para el shader.
 *
 * Frecuencia: 1 vez al montar, cada 20 s en modo "auto" (la elevación cambia
 * lentísimo) y ante cualquier cambio del selector. El scroll y el puntero NO
 * pasan por acá: se aplican en el shader vía `skyBus`.
 */
import { createContext, useContext, useEffect, useState } from "react";
import {
  skyCssVars,
  skyFor,
  skyLabel,
  skyUniforms,
  TOD_ELEVATION,
  type SkyState,
} from "./palettes";
import { useSkyStore } from "./store";
import { getSunInfo, LOCAL_TIME_ZONE } from "./sun";
import { skyBus, skyInputs } from "./bus";
import type { Coords } from "./types";

const SkyStateContext = createContext<SkyState | null>(null);

export function useSkyState(): SkyState {
  return useContext(SkyStateContext) ?? skyFor(0.4, 252);
}

export function SkyRoot({
  children,
  coords = { lat: -34.9016, lng: -55.2635 },
  timeZone = LOCAL_TIME_ZONE,
}: {
  children: React.ReactNode;
  coords?: Coords;
  timeZone?: string;
}) {
  const mode = useSkyStore((state) => state.mode);
  const [state, setState] = useState<SkyState>(() => skyFor(0.4, 252));

  useEffect(() => {
    const root = document.documentElement;
    let disposed = false;

    const apply = () => {
      if (disposed) return;
      const store = useSkyStore.getState();
      let elevation: number;
      let azimuth: number;

      if (store.mode === "auto") {
        const sun = getSunInfo(new Date(), coords, timeZone);
        elevation = sun.elevation;
        azimuth = sun.azimuth;
      } else {
        const manual = TOD_ELEVATION[store.mode];
        elevation = manual.elevation;
        azimuth = manual.azimuth;
      }

      const next = skyFor(elevation, azimuth);
      for (const [key, value] of Object.entries(skyCssVars(next))) {
        root.style.setProperty(key, value);
      }
      root.dataset.skyBright = String(next.bright);
      root.dataset.skyLabel = skyLabel(elevation);

      skyInputs.uniforms = skyUniforms(next);
      skyInputs.elevation = elevation;
      skyInputs.azimuth = azimuth;
      skyBus.time = 0;
      setState(next);
    };

    apply();

    // Solo en modo "auto": si el usuario eligió una hora, no lo interrumpimos.
    const interval = window.setInterval(() => {
      if (useSkyStore.getState().mode === "auto") apply();
    }, 20_000);

    const unsubscribe = useSkyStore.subscribe((store, previous) => {
      if (store.mode !== previous.mode) apply();
    });

    const onVisibility = () => {
      if (document.visibilityState === "visible") apply();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      window.clearInterval(interval);
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [coords, timeZone, mode]);

  return <SkyStateContext.Provider value={state}>{children}</SkyStateContext.Provider>;
}

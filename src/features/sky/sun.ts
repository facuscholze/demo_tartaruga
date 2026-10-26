/**
 * Sol real sobre Punta Colorada.
 *
 * SunCalc trabaja con instantes absolutos: el truco es anclar la consulta al
 * mediodía UTC del día calendario del LOCAL. Con el `new Date()` del visitante,
 * un usuario en Tokio pediría "hoy" y le calcularíamos otro día.
 */
import { getTimes, getPosition } from "suncalc";

export const PUNTA_COLORADA = { lat: -34.9016, lng: -55.2635 } as const;
export const LOCAL_TIME_ZONE = "America/Montevideo";

export type SunInfo = {
  /** `null` cuando el sol no llega a salir/ponerse (no aplica en Maldonado,
   *  pero el tipo lo contempla porque SunCalc lo devuelve). */
  sunrise: Date | null;
  sunset: Date | null;
  solarNoon: Date | null;
  dawn: Date | null;
  dusk: Date | null;
  nauticalDusk: Date | null;
  /** Elevación (-90..90) y azimut (0..360, 0=N) del sol en `at`. */
  elevation: number;
  azimuth: number;
  /** Minutos hasta la próxima puesta de sol (negativo = ya se puso). */
  minutesToSunset: number;
  sunsetLabel: string;
  sunriseLabel: string;
  dayKey: string;
};

const round = (value: number) => Math.round(value * 1000) / 1000;

export function dayKeyIn(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatClock(date: Date, timeZone: string, locale = "es-UY"): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(date);
}

export function getSunInfo(
  at: Date = new Date(),
  coords: { lat: number; lng: number } = PUNTA_COLORADA,
  timeZone: string = LOCAL_TIME_ZONE,
): SunInfo {
  const dayKey = dayKeyIn(at, timeZone);
  const anchor = new Date(`${dayKey}T12:00:00Z`);
  const times = getTimes(anchor, coords.lat, coords.lng);
  const position = getPosition(at, coords.lat, coords.lng);

  const elevation = round((position.altitude * 180) / Math.PI);
  const azimuth = round(((position.azimuth * 180) / Math.PI + 180 + 360) % 360);
  const sunset = times.sunset;
  const sunrise = times.sunrise;
  const minutesToSunset = sunset ? Math.round((sunset.getTime() - at.getTime()) / 60000) : 0;

  return {
    sunrise,
    sunset,
    solarNoon: times.solarNoon,
    dawn: times.dawn,
    dusk: times.dusk,
    nauticalDusk: times.nauticalDusk,
    elevation,
    azimuth,
    minutesToSunset,
    sunsetLabel: sunset ? formatClock(sunset, timeZone) : "—",
    sunriseLabel: sunrise ? formatClock(sunrise, timeZone) : "—",
    dayKey,
  };
}

/** Modo del selector de la demo a partir de la hora real. */
export function todFromElevation(elevation: number): "morning" | "afternoon" | "sunset" | "night" {
  if (elevation < -4) return "night";
  if (elevation < 7) return "sunset";
  if (elevation < 26) return "morning";
  return "afternoon";
}

/** `1h 42m` / `28m` — para el chip "falta poco para el atardecer". */
export function formatCountdown(minutes: number): string {
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;
  const text = hours > 0 ? `${hours}h ${String(mins).padStart(2, "0")}m` : `${mins}m`;
  return minutes >= 0 ? text : `hace ${text}`;
}

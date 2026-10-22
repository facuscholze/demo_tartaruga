/**
 * Formateo de precios, fechas y horarios. La moneda y el locale viven una sola
 * vez en `content/site.json` (`currency`), acá solo se aplican.
 */
import type { Site } from "./schema";
import { pickText, type L10nValue } from "./l10n";

export function formatPrice(
  price: number | undefined,
  currency: Site["currency"],
  locale: string,
): string {
  if (!price || price <= 0) return pickText(currency.consultLabel as L10nValue, locale);
  const formatter = new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
    maximumFractionDigits: 0,
  });
  return formatter.format(price);
}

/** Segundo valor opcional (p. ej. referencia en USD con cotización editable). */
export function formatSecondaryPrice(
  price: number | undefined,
  currency: Site["currency"],
): string | undefined {
  const second = currency.second;
  if (!second?.enabled || !second.code || !second.rate || !price || price <= 0) return undefined;
  const value = price / second.rate;
  return new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: second.code,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(iso: string, locale: string, timeZone = "America/Montevideo"): string {
  const date = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone }).format(
    date,
  );
}

/** `18:42` (sin segundos), en la zona horaria pedida. */
export function formatHHMM(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(date);
}

export function formatWeekday(day: string, locale: string): string {
  const map: Record<string, string> = {
    lun: "Lunes",
    mar: "Martes",
    mie: "Miércoles",
    jue: "Jueves",
    vie: "Viernes",
    sab: "Sábado",
    dom: "Domingo",
  };
  const es = map[day] ?? day;
  if (locale.startsWith("es")) return es;
  const en: Record<string, string> = {
    lun: "Monday",
    mar: "Tuesday",
    mie: "Wednesday",
    jue: "Thursday",
    vie: "Friday",
    sab: "Saturday",
    dom: "Sunday",
  };
  return en[day] ?? es;
}

/** `19:30–01:00` con guion en L. */
export function formatInterval(open?: string, close?: string): string {
  if (!open && !close) return "";
  if (open && !close) return open;
  if (!open && close) return `hasta ${close}`;
  return `${open}–${close}`;
}

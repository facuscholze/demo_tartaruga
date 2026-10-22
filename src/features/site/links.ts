/**
 * Links de conversión (WhatsApp / teléfono / Maps / PDF).
 *
 * Módulo PURÍSIMO: no tiene `"use client"`, así lo pueden importar tanto el
 * Server Component del layout (para pintar el CTA en el HTML) como los
 * componentes de cliente. Importar una función desde un módulo client y
 * llamarla en el server devuelve una referencia cliente: por eso vive acá y no
 * en `context.tsx`.
 */
import type { Site } from "@/features/content/schema";

export type SiteSnapshot = {
  name: string;
  demo: boolean;
  instagram: string;
  instagramHandle: string;
  maps: string;
  menuPdf: string;
  phoneDisplay: string;
  phoneE164: string;
  whatsappE164: string;
  whatsappShortLink: string;
  whatsappConfirmed: boolean;
  coords: { lat: number; lng: number };
  timezone: string;
  currency: Site["currency"];
  hours: Site["hours"];
  address: Site["address"];
  pending: Site["pending"];
};

/** El env gana sobre el JSON: se corrige el número sin tocar contenido. */
export function buildSnapshot(site: Site): SiteSnapshot {
  return {
    name: site.name,
    demo: site.demo,
    instagram: site.links.instagram,
    instagramHandle: site.links.instagramHandle,
    maps: site.links.maps,
    menuPdf: site.links.menuPdf,
    phoneDisplay: site.contact.phoneDisplay,
    phoneE164: site.contact.phoneE164,
    whatsappE164: process.env.NEXT_PUBLIC_WHATSAPP_PHONE || site.contact.whatsapp.phoneE164 || site.contact.phoneE164,
    whatsappShortLink: process.env.NEXT_PUBLIC_WHATSAPP_LINK || site.contact.whatsapp.shortLink || "",
    whatsappConfirmed: site.contact.whatsapp.confirmed,
    coords: site.coords,
    timezone: site.timezone,
    currency: site.currency,
    hours: site.hours,
    address: site.address,
    pending: site.pending,
  };
}

export function telHref(snapshot: SiteSnapshot): string {
  return `tel:${snapshot.phoneE164.replace(/[^\d+]/g, "")}`;
}

export type WhatsappTarget = { shortLink: string; phoneE164: string };

/**
 * `wa.me/<e164>?text=…` o el link corto del perfil, con el mensaje codificado.
 * `buildWhatsappHref` es el núcleo puro: lo pueden importar los Client
 * Components sin tener que pasarles una función por prop (prohibido por React).
 */
export function buildWhatsappHref(target: WhatsappTarget, message: string): string {
  const encoded = encodeURIComponent(message);
  if (target.shortLink) {
    const separator = target.shortLink.includes("?") ? "&" : "?";
    return `${target.shortLink}${separator}text=${encoded}`;
  }
  const phone = target.phoneE164.replace(/[^\d]/g, "");
  return `https://wa.me/${phone}?text=${encoded}`;
}

export function whatsappHref(snapshot: SiteSnapshot, message: string): string {
  return buildWhatsappHref({ shortLink: snapshot.whatsappShortLink, phoneE164: snapshot.whatsappE164 }, message);
}

export function mapsHref(snapshot: SiteSnapshot): string {
  if (snapshot.maps) return snapshot.maps;
  const { lat, lng } = snapshot.coords;
  return `https://www.google.com/maps/search/?api=1&query=${lat}%2C${lng}`;
}

/** Mensaje corto para el CTA general del header/footer (sin formulario). */
export function quickReserveMessage(siteName: string, locale: string): string {
  const messages: Record<string, string> = {
    es: `Hola ${siteName}! Quiero reservar una mesa. ¿Tienen disponibilidad?`,
    en: `Hi ${siteName}! I'd like to book a table. Do you have availability?`,
    pt: `Olá ${siteName}! Quero reservar uma mesa. Têm disponibilidade?`,
  };
  return messages[locale] ?? messages.es!;
}

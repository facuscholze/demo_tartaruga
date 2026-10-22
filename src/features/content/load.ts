/**
 * Carga y validación del contenido (solo server).
 *
 * 1. Lee `content/*.json`.
 * 2. Valida con Zod (los mensajes de error ya están en español en `schema.ts`).
 * 3. Resuelve cada imagen por nombre de archivo → ruta pública / dimensiones / blur.
 * 4. Ordena por `order` (si no hay, por posición) y oculta lo que tiene `available: false`.
 *
 * Ningún componente arma rutas de imagen ni ordena listas: come de acá.
 */
import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";
import type { z } from "zod";
import {
  experiencesSchema,
  faqSchema,
  gallerySchema,
  menuSchema,
  promosSchema,
  siteSchema,
  type ContentFileName,
  type Experience,
  type GalleryItem,
  type MenuItem,
  type Promo,
} from "./schema";
import { resolveImage, resolveIcon, type ResolvedImage } from "./images";

export const CONTENT_DIR = join(process.cwd(), "content");

export class ContentError extends Error {
  constructor(
    file: string,
    message: string,
  ) {
    super(`[contenido] content/${file}: ${message}`);
    this.name = "ContentError";
  }
}

function readRaw(file: ContentFileName): unknown {
  try {
    return JSON.parse(readFileSync(join(CONTENT_DIR, file), "utf8"));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ContentError(file, `JSON mal formado — ${error.message}`);
    }
    throw new ContentError(file, "no se encontró el archivo (o no se pudo leer)");
  }
}

/** Lee `content/<file>`, valida con el esquema y devuelve datos tipados. */
export function loadContent<S extends z.ZodTypeAny>(file: ContentFileName, schema: S): z.infer<S> {
  const result = schema.safeParse(readRaw(file));
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  • ${issue.path.join(".") || "(raíz)"}: ${issue.message}`)
      .join("\n");
    throw new ContentError(file, `la validación falló:\n${issues}`);
  }
  return result.data as z.infer<S>;
}

/* ------------------------------ tipos resueltos ---------------------------- */

export type ResolvedMenuItem = Omit<MenuItem, "image"> & {
  image: ResolvedImage;
  /** Nombre de archivo declarado en el JSON (si lo había). */
  filename?: string;
};

export type ResolvedCategory = {
  id: string;
  name: MenuItem["name"];
  note?: MenuItem["description"];
  iconSrc?: string;
  items: ResolvedMenuItem[];
};

export type ResolvedGalleryItem = Omit<GalleryItem, "image"> & {
  key: string;
  filename: string;
  image: ResolvedImage;
};

export type ResolvedExperience = Omit<Experience, "image" | "icon"> & {
  iconSrc?: string;
  image: ResolvedImage;
  filename?: string;
};

export type ResolvedPromo = Omit<Promo, "image"> & {
  image: ResolvedImage;
  filename?: string;
  activeNow: boolean;
};

export type SiteContent = {
  site: z.infer<typeof siteSchema>;
  menu: { demo: boolean; note?: { es: string; en?: string; pt?: string }; categories: ResolvedCategory[] };
  gallery: ResolvedGalleryItem[];
  experiences: ResolvedExperience[];
  promos: ResolvedPromo[];
  faq: z.infer<typeof faqSchema>["items"];
};

/** Orden: `order` numérico si existe; si no, posición en el JSON. */
function ordered<T extends { order?: number }>(list: T[]): T[] {
  return list
    .map((item, index) => ({ item, index }))
    .sort((a, b) => (a.item.order ?? a.index + 1) - (b.item.order ?? b.index + 1))
    .map(({ item }) => item);
}

/** `2026-10-22` en la zona horaria del local (no la del visitante). */
export function isoDay(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).format(date);
}

export function loadSiteContent(now: Date = new Date()): SiteContent {
  const site = loadContent("site.json", siteSchema);
  const menu = loadContent("menu.json", menuSchema);
  const gallery = loadContent("gallery.json", gallerySchema);
  const experiences = loadContent("experiences.json", experiencesSchema);
  const promos = loadContent("promos.json", promosSchema);
  const faq = loadContent("faq.json", faqSchema);

  const categories: ResolvedCategory[] = ordered(menu.categories).map((category) => ({
    id: category.id,
    name: category.name,
    note: category.note,
    iconSrc: resolveIcon("icons", category.icon),
    items: ordered(category.items)
      .filter((item) => item.available !== false)
      .map((item) => ({
        ...item,
        filename: item.image,
        image: resolveImage("menu", { image: item.image, id: item.id }),
      })),
  }));

  const galleryItems: ResolvedGalleryItem[] = gallery.items.map((item, index) => ({
    ...item,
    key: `${item.section}-${index}-${item.image}`,
    filename: item.image,
    image: resolveImage("gallery", { image: item.image, id: item.image }),
  }));

  const experienceItems: ResolvedExperience[] = experiences.items
    .filter((item) => item.available !== false)
    .map(({ image, icon, ...rest }) => ({
      ...rest,
      filename: image,
      iconSrc: resolveIcon("icons", icon),
      image: resolveImage("experiences", { image, id: rest.id }),
    }));

  const today = isoDay(now, site.timezone);
  const promoItems: ResolvedPromo[] = ordered(promos.promos)
    .map(({ image, ...promo }) => ({
      ...promo,
      filename: image,
      image: resolveImage("promos", { image, id: promo.id }),
      // Se oculta sola pasada `validUntil` (o antes de `validFrom`).
      activeNow: promo.active && promo.validFrom <= today && today <= promo.validUntil,
    }))
    .filter((promo) => promo.activeNow);

  return {
    site,
    menu: { demo: menu.demo, note: menu.note, categories },
    gallery: galleryItems,
    experiences: experienceItems,
    promos: promoItems,
    faq: ordered(faq.items),
  };
}

/** Dedupe por request: layout y page pueden pedir el contenido sin leer dos veces. */
export const getSiteContent = cache(() => loadSiteContent());

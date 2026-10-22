/**
 * Esquemas de contenido (Zod) — fuente única de verdad de `content/*.json`.
 *
 * Reglas de oro:
 *  - En los JSON solo va el NOMBRE del archivo de imagen, nunca rutas.
 *  - Todo texto visible es `{ es, en?, pt? }` (si falta `en`/`pt` se muestra `es`).
 *  - Los precios son números enteros en la moneda de `site.json`; 0 o ausente → "Consultar".
 *  - Cualquier error de validación se reporta en español con archivo, campo y corrección.
 */
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* Primitivas compartidas                                                     */
/* -------------------------------------------------------------------------- */

/** Texto multilingüe. `es` obligatorio (puede ser vacío en descripciones opcionales). */
export const L10n = z.object({
  es: z.string(),
  en: z.string().optional(),
  pt: z.string().optional(),
});

/** Texto multilingüe con `es` no vacío (nombres, títulos, CTA). */
export const L10nRequired = z.object({
  es: z.string().min(1, "el texto en español (\"es\") no puede estar vacío"),
  en: z.string().min(1).optional(),
  pt: z.string().min(1).optional(),
});

/** Nombre de archivo de imagen: minúsculas, sin espacios, sin tildes, con guiones. */
export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif", "svg"] as const;
export const FILENAME_RE = /^[a-z0-9][a-z0-9._-]*\.(?:jpg|jpeg|png|webp|avif|svg)$/;
export const IMAGE_FILENAME = z
  .string()
  .regex(
    FILENAME_RE,
    "debe ser un nombre de archivo en minúsculas, sin espacios ni tildes y con extensión válida (jpg, jpeg, png, webp, avif, svg). Ej: \"pulpo-parrilla.jpg\"",
  );

/** id / slug interno: kebab-case, sin tildes. */
export const ID_RE = /^[a-z0-9][a-z0-9._-]*$/;
export const ID = z
  .string()
  .regex(ID_RE, "debe ser kebab-case en minúsculas (a-z, 0-9, guiones). Ej: \"pulpo-parrilla\"");

/** Fecha ISO YYYY-MM-DD (para vigencias de promos). */
export const ISO_DATE = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "debe ser una fecha con formato AAAA-MM-DD. Ej: \"2026-03-31\"")
  .refine((v) => !Number.isNaN(Date.parse(v)), "no es una fecha real");

/** Hora HH:MM en 24h. */
export const HHMM = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "debe ser una hora con formato HH:MM en 24h. Ej: \"19:30\"");

/** Teléfono tal como lo marcamos en el repo (solo dígitos y signos mínimos). */
const E164 = z
  .string()
  .regex(/^\+?[0-9\s-]{6,20}$/, "debe ser un teléfono en formato E.164 con país, ej: \"+59844321831\"");

/** URL externa válida (único lugar donde se permiten URLs: links del local). */
const ExternalUrl = z
  .union([z.url(), z.literal("")])
  .refine((v) => v === "" || /^https?:\/\//.test(v), "debe ser una URL https o quedar vacía (\"\")");

/* -------------------------------------------------------------------------- */
/* Módulos de imágenes: un solo lugar asocia módulo ↔ carpeta                 */
/* -------------------------------------------------------------------------- */

export const imageModules = [
  "brand",
  "hero",
  "menu",
  "gallery",
  "experiences",
  "promos",
  "icons",
] as const;
export type ImageModule = (typeof imageModules)[number];

/** Carpeta dentro de `public/images/` para cada módulo. */
export const imageModuleDir: Record<ImageModule, string> = {
  brand: "brand",
  hero: "hero",
  menu: "menu",
  gallery: "gallery",
  experiences: "experiences",
  promos: "promos",
  icons: "icons",
};

/** Qué módulo usa cada archivo de contenido (para resolver `"foto.jpg"`). */
export const moduleForContentFile = {
  "menu.json": "menu",
  "gallery.json": "gallery",
  "experiences.json": "experiences",
  "promos.json": "promos",
  "site.json": "brand",
} as const satisfies Record<string, ImageModule>;

/* -------------------------------------------------------------------------- */
/* site.json                                                                  */
/* -------------------------------------------------------------------------- */

export const Day = z.enum(["lun", "mar", "mie", "jue", "vie", "sab", "dom"]);
export type Day = z.infer<typeof Day>;

export const hoursBlock = z.object({
  id: ID,
  order: z.number().int().optional(),
  label: L10nRequired,
  days: z.array(Day).default([]),
  open: HHMM.optional(),
  close: HHMM.optional(),
  note: L10n.optional(),
  /** Datos aún no confirmados por el local: se muestra "a confirmar" en el sitio. */
  confirmed: z.boolean().default(false),
});
export type HoursBlock = z.infer<typeof hoursBlock>;

export const siteSchema = z.object({
  demo: z.boolean().default(true),
  name: z.string().min(1),
  category: z.string().default("Restaurante"),
  claim: L10nOptionalDefault(),
  address: z.object({
    street: L10nRequired,
    locality: L10nRequired,
    region: L10nRequired,
    country: L10nRequired,
    countryCode: z.string().length(2),
    postalCode: z.string().optional(),
  }),
  coords: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
  timezone: z.string().min(1).default("America/Montevideo"),
  contact: z.object({
    phoneDisplay: z.string().min(1),
    phoneE164: E164,
    whatsapp: z.object({
      /** E.164 del número real; verificar con el local (0/O ambiguos en capturas). */
      phoneE164: E164.optional(),
      /** Link `wa.me/message/…` del perfil, si prefieren ese formato. */
      shortLink: ExternalUrl.optional(),
      confirmed: z.boolean().default(false),
    }),
    email: z.union([z.string().email(), z.literal("")]).optional(),
  }),
  links: z.object({
    instagram: ExternalUrl,
    instagramHandle: z.string().min(1),
    maps: ExternalUrl,
    menuPdf: ExternalUrl.default(""),
  }),
  currency: z
    .object({
      code: z.string().length(3).default("UYU"),
      locale: z.string().default("es-UY"),
      /** Si un producto no tiene precio (o es 0) se muestra esta etiqueta. */
      consultLabel: L10nRequired,
      second: z
        .object({
          enabled: z.boolean().default(false),
          code: z.string().length(3).optional(),
          /** 1 unidad de `code` = rate unidades de la moneda principal. */
          rate: z.number().positive().optional(),
        })
        .optional(),
    })
    .default({
      code: "UYU",
      locale: "es-UY",
      consultLabel: { es: "Consultar", en: "Ask us" },
    }),
  hours: z.array(hoursBlock).default([]),
  seo: z.object({
    titleTemplate: z.string().default("%s · Tartaruga Sea-Bar"),
    defaultTitle: L10nRequired,
    description: L10nRequired,
    /** No inventamos servesCuisine ni priceRange: se dejan vacíos hasta confirmar. */
    servesCuisine: z.string().default(""),
    priceRange: z.string().default(""),
  }),
  /** Lista visible de datos que faltan confirmar. Vive en el JSON para que el local la edite. */
  pending: z.array(L10nRequired).default([]),
  i18n: z.object({ locales: z.array(z.string()).default(["es", "en"]), defaultLocale: z.string().default("es") }).default({
    locales: ["es", "en"],
    defaultLocale: "es",
  }),
});
export type Site = z.infer<typeof siteSchema>;

/** `claim` es opcional pero con default para no ensuciar los seed. */
function L10nOptionalDefault() {
  return L10n.optional();
}

/* -------------------------------------------------------------------------- */
/* menu.json                                                                  */
/* -------------------------------------------------------------------------- */

/** Etiquetas conocidas → etiqueta visible. Etiquetas nuevas se muestran tal cual (aviso en el check). */
export const knownTags = ["vegetariano", "vegano", "sin-tacc", "sin-lactosa", "compartir", "crudo", "para-compartir", "sin-alcohol", "local"] as const;
export const tagLabels: Record<string, { es: string; en: string }> = {
  vegetariano: { es: "Vegetariano", en: "Vegetarian" },
  vegano: { es: "Vegano", en: "Vegan" },
  "sin-tacc": { es: "Sin TACC", en: "Gluten free" },
  "sin-lactosa": { es: "Sin lactosa", en: "Lactose free" },
  compartir: { es: "Para compartir", en: "To share" },
  "para-compartir": { es: "Para compartir", en: "To share" },
  crudo: { es: "Crudo", en: "Raw" },
  "sin-alcohol": { es: "Sin alcohol", en: "Alcohol free" },
  local: { es: "Producto local", en: "Local produce" },
};

export const menuItemSchema = z.object({
  id: ID,
  name: L10nRequired,
  description: L10n.default({ es: "" }),
  /** Número entero en la moneda de site.json. 0 o ausente → "Consultar". */
  price: z
    .number({
      error:
        'el precio tiene que ser un número entero en la moneda de site.json (ej. 4500), sin "$" ni texto; 0 o ausente muestra "Consultar"',
    })
    .int("el precio va en números enteros, sin decimales")
    .nonnegative("el precio no puede ser negativo")
    .optional(),
  /** Solo nombre de archivo; se resuelve en /images/menu/<nombre>. */
  image: IMAGE_FILENAME.optional(),
  tags: z.array(z.string()).default([]),
  available: z.boolean().default(true),
  featured: z.boolean().default(false),
  order: z.number().int().optional(),
  /** Alerógenos / observaciones, solo si el local las confirma. */
  allergens: L10n.optional(),
  badge: L10n.optional(),
});
export type MenuItem = z.infer<typeof menuItemSchema>;

export const menuCategorySchema = z.object({
  id: ID,
  order: z.number().int().optional(),
  name: L10nRequired,
  /** Ícono grabado (caracola, estrella de mar…) desde /images/icons/. */
  icon: z.string().optional(),
  note: L10n.optional(),
  items: z.array(menuItemSchema).min(1, "la categoría necesita al menos un producto en \"items\""),
});
export type MenuCategory = z.infer<typeof menuCategorySchema>;

export const menuSchema = z.object({
  /** Marca de agua "DEMO" mientras el local no confirme la carta. */
  demo: z.boolean().default(true),
  updatedAt: z.string().optional(),
  note: L10nOptionalDefault(),
  categories: z.array(menuCategorySchema).min(1, "menu.json necesita al menos una categoría"),
});
export type Menu = z.infer<typeof menuSchema>;

/* -------------------------------------------------------------------------- */
/* gallery.json                                                               */
/* -------------------------------------------------------------------------- */

export const gallerySections = ["lugar", "sunset", "noche", "deck", "fuego"] as const;
export const galleryItemSchema = z.object({
  image: IMAGE_FILENAME,
  alt: z.object({
    es: z.string().min(1, "\"alt\" en español es obligatorio y tiene que describir la foto"),
    en: z.string().min(1).optional(),
    pt: z.string().min(1).optional(),
  }),
  section: z.enum(gallerySections),
  caption: L10nOptionalDefault(),
  /** Prioridad visual dentro del strip (mayor = más grande). */
  weight: z.number().int().min(0).max(3).default(1),
  order: z.number().int().optional(),
});

export const gallerySchema = z.object({
  demo: z.boolean().default(true),
  items: z.array(galleryItemSchema).default([]),
});
export type GalleryItem = z.infer<typeof galleryItemSchema>;
export type Gallery = z.infer<typeof gallerySchema>;

/* -------------------------------------------------------------------------- */
/* experiences.json                                                           */
/* -------------------------------------------------------------------------- */

export const experienceSchema = z.object({
  id: ID,
  order: z.number().int().optional(),
  name: L10nRequired,
  tagline: L10nRequired,
  description: L10n.default({ es: "" }),
  image: IMAGE_FILENAME.optional(),
  icon: z.string().optional(),
  /** Hora sugerida para mostrar en la card (solo si está confirmada por el local). */
  timeLabel: L10n.optional(),
  /** Cielo que ambienta la card (usa el mismo motor que el hero). */
  sky: z.enum(["morning", "afternoon", "sunset", "night"]).default("sunset"),
  confirmed: z.boolean().default(false),
  available: z.boolean().default(true),
  /** Plantilla de mensaje de WhatsApp pre-armado; `{persona}` se reemplaza por el nombre. */
  whatsappNote: L10nOptionalDefault(),
});

export const experiencesSchema = z.object({
  demo: z.boolean().default(true),
  items: z.array(experienceSchema).default([]),
});
export type Experience = z.infer<typeof experienceSchema>;
export type Experiences = z.infer<typeof experiencesSchema>;

/* -------------------------------------------------------------------------- */
/* promos.json                                                                */
/* -------------------------------------------------------------------------- */

export const promoSchema = z.object({
  id: ID,
  title: L10nRequired,
  details: L10n.default({ es: "" }),
  image: IMAGE_FILENAME.optional(),
  validFrom: ISO_DATE,
  validUntil: ISO_DATE,
  active: z.boolean().default(true),
  /** Términos y condiciones: no inventamos porcentajes, se marcan como pendientes. */
  pending: z.boolean().default(false),
  terms: L10nOptionalDefault(),
  order: z.number().int().optional(),
});
export type Promo = z.infer<typeof promoSchema>;

export const promosSchema = z.object({
  demo: z.boolean().default(true),
  promos: z.array(promoSchema).default([]),
});
export type Promos = z.infer<typeof promosSchema>;

/* -------------------------------------------------------------------------- */
/* faq.json                                                                   */
/* -------------------------------------------------------------------------- */

export const faqItemSchema = z.object({
  id: ID,
  question: L10nRequired,
  answer: L10nRequired,
  order: z.number().int().optional(),
  confirmed: z.boolean().default(false),
});

export const faqSchema = z.object({
  items: z.array(faqItemSchema).default([]),
});
export type FaqItem = z.infer<typeof faqItemSchema>;
export type Faq = z.infer<typeof faqSchema>;

/* -------------------------------------------------------------------------- */
/* Registro de archivos de contenido (orden = orden de chequeo)               */
/* -------------------------------------------------------------------------- */

export const contentFiles = [
  { file: "site.json", label: "Datos del local", schema: siteSchema, module: "brand" },
  { file: "menu.json", label: "Carta", schema: menuSchema, module: "menu" },
  { file: "gallery.json", label: "Galería", schema: gallerySchema, module: "gallery" },
  { file: "experiences.json", label: "Experiencias", schema: experiencesSchema, module: "experiences" },
  { file: "promos.json", label: "Promos", schema: promosSchema, module: "promos" },
  { file: "faq.json", label: "Preguntas frecuentes", schema: faqSchema, module: "brand" },
] as const;

export type ContentFileName = (typeof contentFiles)[number]["file"];

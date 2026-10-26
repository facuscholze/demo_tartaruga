/** Espejo ligero de `collectImageRefs` sin dependencias de `server-only`. */
import { IMAGE_EXTENSIONS, type ImageModule } from "../../src/features/content/schema";

export type Ref = { module: ImageModule; filename: string; implied: boolean };

const isIcon = (where: string) => where.includes("icons");

export function collectImageRefsLocal(
  data: Record<string, unknown>,
  file: string,
  module: ImageModule,
): Ref[] {
  const refs: Ref[] = [];
  const push = (filename: unknown, mod: ImageModule, implied = false) => {
    if (typeof filename === "string" && filename.length > 0)
      refs.push({ module: mod, filename, implied });
  };
  const arr = (key: string): Record<string, unknown>[] => {
    const value = data[key];
    return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
  };

  if (file === "menu.json") {
    for (const category of arr("categories")) {
      push(category["icon"], "icons");
      const items = Array.isArray(category["items"])
        ? (category["items"] as Record<string, unknown>[])
        : [];
      for (const item of items) {
        if (item["image"]) push(item["image"], module);
        else push(`${String(item["id"] ?? "item")}.placeholder`, module, true);
      }
    }
  } else if (file === "gallery.json") {
    for (const item of arr("items")) push(item["image"], module);
  } else if (file === "experiences.json") {
    for (const item of arr("items")) {
      push(item["image"], module);
      push(item["icon"], "icons");
    }
  } else if (file === "promos.json") {
    for (const item of arr("promos")) push(item["image"], module);
  }
  void IMAGE_EXTENSIONS;
  void isIcon;
  return refs;
}

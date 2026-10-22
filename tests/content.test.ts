import { describe, expect, it } from "vitest";
import { FILENAME_RE, ID, menuSchema, promosSchema, siteSchema } from "../src/features/content/schema";
import { loadContent } from "../src/features/content/load";

describe("esquemas de contenido", () => {
  it("rechaza rutas completas en el campo image", () => {
    expect(FILENAME_RE.test("/images/menu/pulpo.jpg")).toBe(false);
    expect(FILENAME_RE.test("https://cdn.com/pulpo.jpg")).toBe(false);
    expect(FILENAME_RE.test("pulpo-parrilla.jpg")).toBe(true);
  });

  it("exige id en kebab-case", () => {
    expect(ID.safeParse("pulpo-parrilla").success).toBe(true);
    expect(ID.safeParse("Pulpo Parrilla").success).toBe(false);
    expect(ID.safeParse("pulpo-pá").success).toBe(false);
  });

  it("rechaza precios que no son número y explica en español", () => {
    const parsed = menuSchema.safeParse({
      categories: [{ id: "entradas", name: { es: "Entradas" }, items: [{ id: "x", name: { es: "X" }, price: "$4.500" }] }],
    });
    expect(parsed.success).toBe(false);
    const issue = parsed.error!.issues.find((i) => i.path.includes("price"));
    expect(issue?.message).toContain("número");
  });

  it("el precio 0 significa 'Consultar' (no lo inventa)", () => {
    const parsed = menuSchema.parse({
      categories: [{ id: "entradas", name: { es: "Entradas" }, items: [{ id: "x", name: { es: "X" }, price: 0 }] }],
    });
    expect(parsed.categories[0]!.items[0]!.price).toBe(0);
  });

  it("`available: false` sigue siendo válido (se oculta sin borrar)", () => {
    const parsed = menuSchema.parse({
      categories: [{ id: "a", name: { es: "A" }, items: [{ id: "x", name: { es: "X" }, available: false }] }],
    });
    expect(parsed.categories[0]!.items[0]!.available).toBe(false);
  });
});

describe("seed de la demo", () => {
  it("los JSON reales parsean con los esquemas", () => {
    expect(() => loadContent("site.json", siteSchema)).not.toThrow();
    expect(() => loadContent("menu.json", menuSchema)).not.toThrow();
    expect(() => loadContent("promos.json", promosSchema)).not.toThrow();
  });

  it("la promo Scotiabank está marcada 'a confirmar' y no tiene condiciones inventadas", () => {
    const promos = loadContent("promos.json", promosSchema);
    const scotiabank = promos.promos.find((promo) => promo.id === "scotiabank");
    expect(scotiabank?.pending).toBe(true);
    expect(scotiabank?.details.es).toContain("A CONFIRMAR");
  });

  it("site.json no tiene horarios inventados", () => {
    const site = loadContent("site.json", siteSchema);
    expect(site.hours.every((block) => !block.confirmed)).toBe(true);
    expect(site.contact.phoneDisplay).toBe("4432 18 31");
    expect(site.links.instagramHandle).toBe("@tartaruga.puntacolorada");
  });
});

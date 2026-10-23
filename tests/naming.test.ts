import { describe, expect, it } from "vitest";
import {
  hasValidName,
  nameProblems,
  normalizeFilename,
  normalizeId,
  suggestName,
} from "../src/lib/naming";

describe("convenciones de nombres de archivo", () => {
  it("normaliza mayúsculas, espacios y tildes", () => {
    expect(normalizeFilename("Milanesa a la Navaja.JPG")).toBe("milanesa-a-la-navaja.jpg");
    expect(normalizeFilename("Pulpo a la Parrilla (2).png")).toBe("pulpo-a-la-parrilla-2.png");
    expect(normalizeFilename("  ÁÉÍÓÚ  Ñ.jpg")).toBe("aeiou-n.jpg");
  });

  it("detecta los problemas que reporta content:check", () => {
    expect(nameProblems("Foto de Carta.JPG")).toContain("tiene mayúsculas");
    expect(nameProblems("pulpo-parrilla.jpg")).toEqual([]);
    expect(hasValidName("pulpo parrilla")).toBe(false);
    expect(hasValidName("pulpo-parrilla")).toBe(true);
  });

  it("ids sin tildes ni espacios", () => {
    expect(normalizeId("Pulpo a la parrilla")).toBe("pulpo-a-la-parrilla");
    expect(normalizeId("Churrasco Ñandú")).toBe("churrasco-nandu");
  });

  it("sugiere el nombre más parecido (¿quisiste decir…?)", () => {
    const pool = ["pulpo-parrilla.jpg", "mojito.jpg", "tostadas-de-palta.jpg"];
    expect(suggestName("pulpo-parilla.jpg", pool)).toBe("pulpo-parrilla.jpg");
    expect(suggestName("mojito.png", pool)).toBe("mojito.jpg");
    expect(suggestName("pizza-muzzarella.jpg", pool)).toBeUndefined();
  });
});

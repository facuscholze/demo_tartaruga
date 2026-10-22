import { describe, expect, it } from "vitest";
import { skyCssVars, skyFor, skyLabel, sunPosition, TOD_ELEVATION } from "../src/features/sky/palettes";
import { formatClock, getSunInfo, todFromElevation } from "../src/features/sky/sun";

describe("motor del cielo", () => {
  it("la luma crece con la elevación del sol (texto oscuro ↔ claro sin huecos)", () => {
    const night = skyFor(-14, 250);
    const sunset = skyFor(0.6, 252);
    const day = skyFor(40, 200);
    expect(night.luma).toBeLessThan(sunset.luma);
    expect(sunset.luma).toBeLessThan(day.luma);
  });

  it("el fuego es más intenso de noche que de día", () => {
    expect(skyFor(-14, 250).fire).toBeGreaterThan(skyFor(40, 200).fire);
    expect(skyFor(-14, 250).stars).toBeGreaterThan(0.5);
    expect(skyFor(40, 200).stars).toBe(0);
  });

  it("los colores siempre son hex válidos (los consume CSS y GLSL)", () => {
    const state = skyFor(3.5, 260);
    for (const key of ["top", "mid", "low", "horizon", "sun", "sea"] as const) {
      expect(state[key]).toMatch(/^#[0-9a-f]{6}$/);
    }
    const vars = skyCssVars(state);
    expect(vars["--sky-top"]).toBe(state.top);
    expect(vars["--fire-intensity"]).toBeDefined();
  });

  it("el selector manual cubre las cuatro horas pedidas", () => {
    expect(Object.keys(TOD_ELEVATION).sort()).toEqual(["afternoon", "morning", "night", "sunset"]);
    expect(TOD_ELEVATION.night.elevation).toBeLessThan(0);
  });

  it("el sol está sobre el horizonte al mediodía local y bajo a medianoche", () => {
    const noon = getSunInfo(new Date("2026-12-21T14:00:00Z")); // ~11:00 en Uruguay
    const midnight = getSunInfo(new Date("2026-12-21T03:00:00Z")); // ~00:00 en Uruguay
    expect(noon.elevation).toBeGreaterThan(45);
    expect(midnight.elevation).toBeLessThan(-15);
    expect(noon.sunsetLabel).toMatch(/^\d{2}:\d{2}$/);
    expect(noon.sunrise!.getTime()).toBeLessThan(noon.sunset!.getTime());
  });

  it("las etiquetas de hora coinciden con la elevación", () => {
    expect(skyLabel(-20)).toBe("noche");
    expect(skyFor(-20, 0).bright).toBe(false);
    expect(todFromElevation(50)).toBe("afternoon");
    expect(todFromElevation(-10)).toBe("night");
    expect(todFromElevation(1)).toBe("sunset");
  });

  it("el sol sale por el este y se pone por el oeste en la pantalla", () => {
    const morning = sunPosition(16, 95);
    const evening = sunPosition(0.5, 252);
    expect(morning.x).toBeLessThan(evening.x);
    expect(morning.y).toBeLessThan(evening.y); // más alto = menos uv.y
  });

  it("formatea la hora en la zona del local, no en la del visitante", () => {
    const date = new Date("2026-03-15T21:30:00Z");
    expect(formatClock(date, "America/Montevideo")).toBe("18:30");
    expect(formatClock(date, "Europe/Madrid")).toBe("22:30");
  });
});

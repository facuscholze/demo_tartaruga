import { describe, expect, it } from "vitest";
import { buildBookingMessage, formatDateLocal } from "../src/features/booking/message";
import { bookingSchema } from "../src/features/booking/schema";

const labels = {
  title: "Reserva",
  venue: "Tartaruga Sea-Bar",
  name: "Nombre",
  date: "Fecha",
  time: "Hora",
  people: "Personas",
  occasion: "Ocasión",
  pet: "Mascota",
  petYes: "Sí, vengo con perro",
  message: "Mensaje",
};

describe("mensaje de WhatsApp pre-armado", () => {
  it("arma un mensaje legible para el local", () => {
    const text = buildBookingMessage(
      { name: "Ana Rodríguez", date: "2026-12-24", time: "20:30", people: 4, occasion: "Cumpleaños", pet: true, experience: "Sunset", message: "Si puede ser mesa cerca del fuego" },
      labels,
    );
    expect(text).toContain("Reserva — Tartaruga Sea-Bar");
    expect(text).toContain("Fecha: 24/12/2026");
    expect(text).toContain("Personas: 4");
    expect(text).toContain(`Mascota: ${labels.petYes}`);
    expect(text).toContain("* Sunset");
    expect(text.endsWith("cerca del fuego")).toBe(true);
  });

  it("omite lo que no se llenó (no manda campos vacíos)", () => {
    const text = buildBookingMessage({ name: "Juli", date: "2026-01-05", time: "19:00", people: 2 }, labels);
    expect(text).not.toContain("Ocasión");
    expect(text).not.toContain("Mascota");
    expect(text).not.toContain("Mensaje");
  });

  it("formatea la fecha local uruguaya", () => {
    expect(formatDateLocal("2026-10-22")).toBe("22/10/2026");
    expect(formatDateLocal("mañana")).toBe("mañana");
  });
});

describe("validación del formulario", () => {
  it("rechaza fechas y horas mal formadas", () => {
    expect(bookingSchema.safeParse({ name: "Ana", date: "22-10-2026", time: "20:00", people: 2 }).success).toBe(false);
    expect(bookingSchema.safeParse({ name: "Ana", date: "2026-10-22", time: "25:70", people: 2 }).success).toBe(false);
  });

  it("acepta una reserva completa y normaliza `people` de string", () => {
    const parsed = bookingSchema.parse({ name: " Ana ", date: "2026-10-22", time: "20:00", people: "3" });
    expect(parsed.people).toBe(3);
    expect(parsed.name).toBe("Ana");
  });

  it("el honeypot solo acepta vacío", () => {
    expect(bookingSchema.safeParse({ name: "Ana", date: "2026-10-22", time: "20:00", people: 2, company: "bot" }).success).toBe(false);
  });
});

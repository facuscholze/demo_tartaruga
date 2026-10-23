import { z } from "zod";

/** Validación del formulario (la misma en cliente y en el handler del webhook). */
export const bookingSchema = z.object({
  name: z.string().trim().min(2, "errorName").max(80),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "errorDate")
    .refine((value) => !Number.isNaN(Date.parse(value)), "errorDate"),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "errorTime"),
  people: z.coerce.number().int().min(1, "errorPeople").max(40, "errorPeople"),
  occasion: z.string().max(40).optional(),
  pet: z.boolean().optional(),
  message: z.string().max(600).optional(),
  experience: z.string().max(60).optional(),
  /** Honeypot: si viene con valor, se descarta en silencio. */
  company: z.string().max(0).optional(),
});

export type BookingForm = z.infer<typeof bookingSchema>;

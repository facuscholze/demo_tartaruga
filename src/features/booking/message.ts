/**
 * Armado del mensaje de WhatsApp. Función pura y testeable: su única
 * responsabilidad es que el local reciba un mensaje legible y completo.
 */
export type BookingInput = {
  name: string;
  date: string; // AAAA-MM-DD
  time: string; // HH:MM
  people: number;
  occasion?: string;
  pet?: boolean;
  message?: string;
  experience?: string;
};

export type BookingLabels = {
  title: string;
  venue: string;
  name: string;
  date: string;
  time: string;
  people: string;
  occasion: string;
  pet: string;
  petYes: string;
  message: string;
};

/** `2026-12-24` → `24/12/2026` (formato que lee un humano uruguayo). */
export function formatDateLocal(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const [year, month, day] = iso.split("-") as [string, string, string];
  return `${day}/${month}/${year}`;
}

export function buildBookingMessage(input: BookingInput, labels: BookingLabels): string {
  const lines: string[] = [`${labels.title} — ${labels.venue}`, ""];
  lines.push(`${labels.name}: ${input.name.trim()}`);
  lines.push(`${labels.date}: ${formatDateLocal(input.date)}`);
  lines.push(`${labels.time}: ${input.time}`);
  lines.push(`${labels.people}: ${input.people}`);
  if (input.occasion && input.occasion !== "none")
    lines.push(`${labels.occasion}: ${input.occasion}`);
  if (input.pet) lines.push(`${labels.pet}: ${labels.petYes}`);
  if (input.experience) lines.push(`* ${input.experience}`);
  const note = input.message?.trim();
  if (note) lines.push("", `${labels.message}:`, note);
  return lines
    .join("\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

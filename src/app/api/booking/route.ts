import { NextResponse } from "next/server";
import { bookingSchema } from "@/features/booking/schema";

/**
 * Endpoint de reserva. NO guarda nada: valida y reenvía al webhook del
 * destinatario (`BOOKING_WEBHOOK_URL`: Slack, Make, n8n, un script propio).
 * Sin webhook, responde OK igual: el canal real es WhatsApp y el formulario ya
 * lo abrió. Nunca se loguean datos personales.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "json" }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid",
        issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      },
      { status: 422 },
    );
  }
  if (parsed.data.company) {
    // Honeypot completo: respuesta neutra para no darle señales al bot.
    return NextResponse.json({ ok: true });
  }

  const target = process.env.BOOKING_WEBHOOK_URL;
  if (!target) return NextResponse.json({ ok: true, forwarded: false });

  try {
    const response = await fetch(target, {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": "tartaruga-site/1.0" },
      body: JSON.stringify({ ...parsed.data, submittedAt: new Date().toISOString() }),
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return NextResponse.json({ ok: true, forwarded: false }, { status: 200 });
    return NextResponse.json({ ok: true, forwarded: true });
  } catch {
    // Un webhook caído no le puede arruinar la reserva a nadie: WhatsApp ya está abierto.
    return NextResponse.json({ ok: true, forwarded: false });
  }
}

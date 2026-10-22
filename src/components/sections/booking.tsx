import { getLocale, getTranslations } from "next-intl/server";
import { getSiteContent } from "@/features/content/load";
import { pickText } from "@/features/content/l10n";
import { buildSnapshot, quickReserveMessage, telHref, whatsappHref } from "@/features/site/links";
import { BookingForm } from "@/components/sections/booking-form";

/**
 * Reserva. El CTA principal del sitio: fijo en el header, barra abajo en móvil
 * y esta sección con el formulario. Convertir sin fricción > cualquier efecto.
 */
export async function BookingSection() {
  const locale = await getLocale();
  const t = await getTranslations("booking");
  const content = await getSiteContent();
  const snapshot = buildSnapshot(content.site);
  const reserveHref = whatsappHref(snapshot, quickReserveMessage(snapshot.name, locale));

  return (
    <section
      id="reservar"
      aria-labelledby="booking-title"
      className="relative isolate overflow-clip border-t border-[var(--line)] bg-[linear-gradient(180deg,var(--c-navy),var(--c-night))] py-20 md:py-28"
    >
      <div className="grain absolute inset-0 -z-10 opacity-70" aria-hidden />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[45%] bg-[radial-gradient(70%_100%_at_50%_0%,color-mix(in_oklab,var(--sky-sun)_26%,transparent),transparent_70%)]"
      />

      <div className="shell grid gap-12 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <div>
            <p className="label text-[var(--c-spark)]">{t("title")}</p>
            <h2 id="booking-title" data-reveal="words" className="mt-3 max-w-[12ch] text-[var(--text-display)] text-[var(--fg)]">
              {t("title")}
            </h2>
          </div>

          <div className="flex flex-col gap-2">
            <a href={reserveHref} target="_blank" rel="noopener noreferrer" className="btn self-start" data-cursor="reservar">
              {t("whatsappLabel")}
            </a>
            <a href={telHref(snapshot)} className="label self-start text-[var(--fg-muted)] underline underline-offset-4 hover:text-[var(--fg)]">
              {t("phoneLabel")} · {snapshot.phoneDisplay}
            </a>
          </div>

          <p className="max-w-[38ch] text-[0.9rem] leading-relaxed text-[var(--fg-faint)]">
            {locale.startsWith("en")
              ? "We answer by WhatsApp during the day. The form writes the message for you, you just press send."
              : locale.startsWith("pt")
                ? "Respondemos por WhatsApp durante o dia. O formulário já escreve a mensagem; você só envia."
                : "Respondemos por WhatsApp durante el día. El formulario te deja el mensaje escrito, vos solo lo mandás."}
          </p>

          {snapshot.demo ? (
            <p className="label border-l-2 border-[var(--c-ember)]/50 pl-3 text-[0.56rem] leading-relaxed text-[var(--c-ember)]">
              {locale.startsWith("en")
                ? "Demo: number and hours to be confirmed with the venue"
                : "Demo: número y horarios a confirmar con el local"}
            </p>
          ) : null}
        </div>

        <div className="relative">
          <BookingForm
            venue={snapshot.name}
            whatsapp={{ shortLink: snapshot.whatsappShortLink, phoneE164: snapshot.whatsappE164 }}
            experienceOptions={content.experiences.map((item) => ({ id: item.id, name: pickText(item.name, locale) }))}
          />
          <span className="sr-only">{reserveHref}</span>
        </div>
      </div>
    </section>
  );
}

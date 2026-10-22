import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/sections/hero";
import { getSiteContent } from "@/features/content/load";
import { buildSnapshot, quickReserveMessage, whatsappHref } from "@/features/site/links";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const content = await getSiteContent();
  const snapshot = buildSnapshot(content.site);
  const reserveHref = whatsappHref(snapshot, quickReserveMessage(snapshot.name, locale));

  return (
    <>
      <Hero reserveHref={reserveHref} />
      <div className="shell py-20 text-[var(--fg-muted)]">
        <p className="label">Fase 1 en curso · secciones siguientes: fuego, carta, lugar, experiencias…</p>
      </div>
    </>
  );
}

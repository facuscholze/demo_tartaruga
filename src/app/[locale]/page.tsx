import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/sections/hero";
import { FireSection } from "@/components/sections/fire";
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
      <FireSection />
    </>
  );
}

import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/sections/hero";
import { FireSection } from "@/components/sections/fire";
import { MenuSection } from "@/components/sections/menu";
import { PlaceSection } from "@/components/sections/place";
import { SunsetSection } from "@/components/sections/sunset";
import { ExperiencesSection } from "@/components/sections/experiences";
import { PetSection } from "@/components/sections/pet";
import { ArtisanalSection } from "@/components/sections/artisanal";
import { PerksSection } from "@/components/sections/perks";
import { BookingSection } from "@/components/sections/booking";
import { FaqSection } from "@/components/sections/faq";
import { getSiteContent } from "@/features/content/load";
import { buildSnapshot, quickReserveMessage, whatsappHref } from "@/features/site/links";

/**
 * Orden narrativo: atardecer → fuego → carta → el lugar → sunset → experiencias.
 * Cada sección es un Server Component que lee `content/*.json`; lo único que
 * baja al cliente es lo que necesita interactuar.
 */
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
      <MenuSection />
      <PlaceSection />
      <SunsetSection />
      <ExperiencesSection />
      <ArtisanalSection />
      <PetSection />
      <PerksSection />
      <FaqSection />
      <BookingSection />
    </>
  );
}

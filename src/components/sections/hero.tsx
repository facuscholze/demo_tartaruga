import { getLocale, getTranslations } from "next-intl/server";
import { SkySurface } from "@/components/fx/sky-surface";
import { ButtonLink } from "@/components/ui/button-link";
import { Icon } from "@/components/ui/icon";
import { HorizonWaves, Lighthouse, TurtleMark } from "@/components/brand/turtle";
import { SunTicker } from "@/components/sections/sun-ticker";
import { HeroTitle } from "@/components/sections/hero-title";
import { TimeOfDaySelect } from "@/components/controls";
import { getSiteContent } from "@/features/content/load";
import { pickText } from "@/features/content/l10n";

/**
 * Hero "Atardecer en vivo".
 *
 * Todo lo esencial (nombre, Reservar, Cómo llegar, dónde estamos, hora del
 * sol) se renderiza en el servidor: si WebGL o el JS fallan, el hero sigue
 * siendo un hero útil. El shader es una capa encima, nunca debajo del contenido.
 */
export async function Hero({ reserveHref }: { reserveHref: string }) {
  const locale = await getLocale();
  const t = await getTranslations("hero");
  const content = await getSiteContent();
  const site = content.site;

  return (
    <section
      id="hero"
      data-hero
      className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-clip pb-[max(6rem,10vh)] pt-[calc(var(--header-h)+2.5rem)]"
    >
      <SkySurface />

      <div className="shell relative z-[4] flex flex-col gap-7">
        <p className="label flex flex-wrap items-center gap-x-3 gap-y-1 text-[var(--fg-muted)]">
          <TurtleMark className="h-5 w-auto shrink-0 text-[var(--fg)]" stroke={10} title="" />
          <span>{pickText(site.address.street, locale)}</span>
          <span aria-hidden>·</span>
          <span>{pickText(site.address.locality, locale)}</span>
          <span aria-hidden>·</span>
          <span>{pickText(site.address.country, locale)}</span>
        </p>

        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute right-[-2vw] top-[-26vw] hidden w-[24vw] max-w-[16rem] opacity-[0.14] lg:block"
          >
            <Lighthouse className="w-full text-[var(--c-bone)]" />
          </div>
          <HeroTitle title={site.name} claim={pickText(site.claim, locale)} />
        </div>

        <HorizonWaves className="h-12 w-full max-w-[70rem] text-[color-mix(in_oklab,var(--c-bone)_70%,transparent)]" />

        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink
            href={reserveHref}
            dataCursor="reservar"
            className="px-6 py-3.5 text-[0.72rem]"
          >
            <Icon name="whatsapp" size={17} />
            <span>{t("reserveCta")}</span>
          </ButtonLink>
          <ButtonLink href={site.links.maps} variant="ghost" external className="text-[0.68rem]">
            <Icon name="pin" size={16} />
            <span>{t("directionsCta")}</span>
          </ButtonLink>
          <div className="ml-auto hidden md:block">
            <TimeOfDaySelect />
          </div>
        </div>
      </div>

      <div className="shell relative z-[4] mt-7 flex flex-wrap items-end justify-between gap-6">
        <SunTicker />
        <a
          href="#fuego"
          data-scroll-to
          className="label inline-flex items-center gap-2 text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]"
        >
          <span>{t("scroll")}</span>
          <Icon name="arrow-down" size={16} />
        </a>
      </div>
    </section>
  );
}

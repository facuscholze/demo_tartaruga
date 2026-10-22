import { getLocale, getTranslations } from "next-intl/server";
import { getSiteContent } from "@/features/content/load";
import { pickText } from "@/features/content/l10n";
import { buildSnapshot, whatsappHref } from "@/features/site/links";
import { skyFor, skyGradient, TOD_ELEVATION } from "@/features/sky/palettes";
import { Media } from "@/components/ui/media";
import { ShellIcon } from "@/components/brand/shell-icon";
import { cn } from "@/lib/utils";

/**
 * Experiencias: cada card respira con el cielo de SU hora (mismo motor de
 * paletas del hero, evaluado en el servidor → cero JS para verse bien) y
 * abre WhatsApp con el mensaje ya escrito, para que reservar sea un toque.
 */
export async function ExperiencesSection() {
  const locale = await getLocale();
  const t = await getTranslations("experiences");
  const content = await getSiteContent();
  const snapshot = buildSnapshot(content.site);
  const items = content.experiences.filter((item) => item.available);

  return (
    <section id="experiencias" aria-labelledby="exp-title" className="relative isolate py-20 md:py-28">
      <div className="shell flex flex-col gap-10">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <h2 id="exp-title" data-reveal="words" className="max-w-[16ch] text-[var(--text-display)] text-[var(--fg)]">
            {t("title")}
          </h2>
          <p className="max-w-[40ch] text-[0.95rem] leading-relaxed text-[var(--fg-muted)]">
            {locale.startsWith("en")
              ? "Four ways to spend the same afternoon. Pick one and we keep your table."
              : locale.startsWith("pt")
                ? "Quatro jeitos de viver a mesma tarde. Escolha um e guardamos a mesa."
                : "Cuatro maneras de vivir la misma tarde. Elegí una y te guardamos la mesa."}
          </p>
        </header>

        <ul className="grid gap-5 sm:grid-cols-2">
          {items.map((item) => {
            const tod = TOD_ELEVATION[item.sky];
            const sky = skyFor(tod.elevation, tod.azimuth);
            return (
              <li key={item.id} data-reveal="mask" className="h-full">
                <article
                  className={cn(
                    "card relative flex h-full flex-col justify-between gap-6 overflow-clip p-5 md:p-6",
                    "transition-[transform,border-color] duration-[var(--d-3)] ease-[var(--ease-sea)]",
                    "hover:-translate-y-1 hover:border-[color-mix(in_oklab,var(--c-ember)_45%,var(--line))]",
                  )}
                >
                  <div
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-[45%] opacity-45 mix-blend-screen transition-opacity duration-[var(--d-4)] group-hover:opacity-70"
                    style={{ backgroundImage: skyGradient(sky) }}
                  />
                  <div className="relative z-[2]">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-[1.5rem] leading-tight text-[var(--fg)]">{pickText(item.name, locale)}</h3>
                      {item.iconSrc ? (
                        <ShellIcon src={item.iconSrc} className="mt-1 h-5 w-5 shrink-0 text-[var(--c-ember)]" />
                      ) : null}
                    </div>
                    <p className="label mt-1.5 text-[var(--c-spark)]/80">{pickText(item.tagline, locale)}</p>
                    <p className="mt-3 max-w-[46ch] text-[0.94rem] leading-relaxed text-[var(--fg-muted)]">
                      {pickText(item.description, locale)}
                    </p>
                    {!item.confirmed ? (
                      <p className="label mt-3 text-[0.53rem] text-[var(--c-ember)]">
                        {locale.startsWith("en") ? "times & format to confirm" : "horarios y formato a confirmar"}
                      </p>
                    ) : null}
                  </div>

                  <div className="relative z-[2] flex items-end justify-between gap-4">
                    {item.image.src ? (
                      <div className="h-20 w-28 shrink-0 overflow-clip rounded-[3px] border border-[var(--line)]">
                        <Media
                          src={item.image.src}
                          alt={pickText(item.name, locale)}
                          width={item.image.width}
                          height={item.image.height}
                          blurDataURL={item.image.blurDataURL}
                          sizes="11rem"
                        />
                      </div>
                    ) : null}
                    <a
                      href={whatsappHref(
                        snapshot,
                        item.whatsappNote ? pickText(item.whatsappNote, locale) : pickText(item.name, locale),
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost shrink-0 py-2 text-[0.78rem]"
                      data-cursor="reservar"
                    >
                      {t("reserve")}
                    </a>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

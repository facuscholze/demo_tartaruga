import { getLocale, getTranslations } from "next-intl/server";
import { TurtleMark } from "@/components/brand/turtle";
import { Icon } from "@/components/ui/icon";
import { pickText } from "@/features/content/l10n";
import { formatInterval } from "@/features/content/format";
import { getSiteContent } from "@/features/content/load";
import type { SiteSnapshot } from "@/features/site/links";

/**
 * Pie de página: dirección, horarios, teléfono, Instagram y el aviso de demo.
 * Es la red de seguridad del sitio — si el JS o WebGL caen, acá está todo lo
 * que un visitante necesita para llegar y reservar.
 */
export async function Footer({ snapshot, links }: { snapshot: SiteSnapshot; links: { whatsapp: string; tel: string } }) {
  const locale = await getLocale();
  const t = await getTranslations("footer");
  const visit = await getTranslations("visit");
  const nav = await getTranslations("nav");
  const content = await getSiteContent();
  const hours = content.site.hours;

  return (
    <footer id="visitar" className="relative z-[5] border-t border-[var(--line)] bg-[var(--c-abyss)] pb-[calc(6rem+env(safe-area-inset-bottom))] pt-16 md:pb-16">
      <div className="shell grid gap-12 lg:grid-cols-[1.15fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <TurtleMark className="h-11 w-auto text-[var(--fg)]" stroke={7} />
            <p className="m-0 font-display text-2xl leading-none">
              {snapshot.name}
              <span className="block font-type text-[0.6rem] tracking-[0.24em] text-[var(--fg-faint)]">SEA-BAR</span>
            </p>
          </div>
          <address className="mt-6 flex flex-col gap-1.5 text-[0.95rem] not-italic text-[var(--fg-muted)]">
            <span className="inline-flex items-start gap-2">
              <Icon name="pin" size={16} className="mt-1 shrink-0" />
              <span>
                {pickText(snapshot.address.street, locale)}
                <br />
                {pickText(snapshot.address.locality, locale)}, {pickText(snapshot.address.region, locale)},{" "}
                {pickText(snapshot.address.country, locale)}
              </span>
            </span>
            <span className="inline-flex items-center gap-2">
              <Icon name="phone" size={16} />
              <a href={links.tel} className="font-type tabular-nums hover:text-[var(--fg)]">
                {snapshot.phoneDisplay}
              </a>
            </span>
          </address>

          <div className="mt-6 flex flex-wrap gap-3">
            <a className="btn" href={links.whatsapp} target="_blank" rel="noopener noreferrer" data-cursor="reservar">
              <Icon name="whatsapp" size={16} />
              {nav("reserve")}
            </a>
            <a className="btn btn-ghost" href={snapshot.instagram} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
          </div>
        </div>

        <div>
          <h2 className="label text-[var(--fg-faint)]">{visit("hoursTitle")}</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {hours.map((block) => (
              <li key={block.id}>
                <p className="font-display text-lg leading-tight">{pickText(block.label, locale)}</p>
                <p className="mt-1 font-type text-[0.82rem] tabular-nums text-[var(--fg-muted)]">
                  {block.open || block.close ? (
                    <>
                      {block.days.length > 0 && <span className="mr-2">{block.days.join("·")}</span>}
                      {formatInterval(block.open, block.close)}
                    </>
                  ) : (
                    <span className="text-[var(--c-ember)]">
                      {visit("hoursPending")}{" "}
                      <span className="label text-[var(--fg-faint)]">{t("pendingTag")}</span>
                    </span>
                  )}
                </p>
                {block.note ? <p className="mt-1 text-[0.82rem] text-[var(--fg-faint)]">{pickText(block.note, locale)}</p> : null}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="label text-[var(--fg-faint)]">{t("demoTitle")}</h2>
          <p className="mt-4 text-[0.92rem] leading-relaxed text-[var(--fg-muted)]">{t("demoBody")}</p>
          {snapshot.pending.length > 0 ? (
            <>
              <p className="label mt-6 text-[var(--fg-faint)]">{t("pendingTitle")}</p>
              <ul className="mt-2 flex list-none flex-col gap-1 p-0 font-type text-[0.72rem] leading-relaxed text-[var(--fg-faint)]">
                {snapshot.pending.slice(0, 10).map((item, index) => (
                  <li key={index} className="flex gap-2">
                    <span aria-hidden>—</span>
                    <span>{pickText(item, locale)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </div>

      <div className="shell mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-6">
        <p className="label text-[var(--fg-faint)]">{t("rights")}</p>
        <p className="label text-[var(--fg-faint)]">{t("madeWith")}</p>
      </div>
    </footer>
  );
}

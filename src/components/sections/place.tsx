import { getLocale, getTranslations } from "next-intl/server";
import { getSiteContent } from "@/features/content/load";
import { pickText } from "@/features/content/l10n";
import { formatInterval, formatWeekday } from "@/features/content/format";
import { buildSnapshot } from "@/features/site/links";
import { GalleryStrip } from "@/components/sections/gallery-strip";
import { CoastMap } from "@/components/ui/coast-map";

/**
 * El lugar: tira de fotos + mapa. Las imágenes salen de `content/gallery.json`
 * (carpeta `public/images/gallery/`), así subir fotos nuevas no toca código.
 */
export async function PlaceSection() {
  const locale = await getLocale();
  const t = await getTranslations("place");
  const content = await getSiteContent();
  const items = content.gallery.filter((item) => item.section === "lugar" || item.section === "deck");

  return (
    <section id="lugar" aria-labelledby="lugar-title" className="relative isolate py-20 md:py-28">
      <div className="shell flex flex-col gap-10">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="label text-[var(--c-ember)]">{t("title")}</p>
            <h2 id="lugar-title" data-reveal="words" className="mt-3 max-w-[18ch] text-[var(--text-display)] text-[var(--fg)]">
              {t("title")}
            </h2>
          </div>
          <p data-reveal="fade" className="max-w-[46ch] text-[1.02rem] leading-relaxed text-[var(--fg-muted)]">
            {t("text")}
          </p>
        </header>

        <GalleryStrip
          label={t("title")}
          hint={t("hint")}
          items={items.map((item) => ({
            key: item.key,
            alt: pickText(item.alt, locale),
            caption: item.caption ? pickText(item.caption, locale) : undefined,
            weight: item.weight,
            photo: {
              src: item.image.src,
              alt: pickText(item.alt, locale),
              caption: item.caption ? pickText(item.caption, locale) : undefined,
              width: item.image.width,
              height: item.image.height,
              blur: item.image.blurDataURL,
            },
          }))}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)]">
          <VisitTimes />
          <CoastMap
            snapshot={buildSnapshot(content.site)}
            locale={locale}
            title={t("mapTitle")}
            note={t("mapNote")}
            openLabel={t("openInMaps")}
          />
        </div>
      </div>
    </section>
  );
}

/** Horarios: se marcan los que el local aún no confirmó, sin inventar días. */
async function VisitTimes() {
  const locale = await getLocale();
  const t = await getTranslations("visit");
  const content = await getSiteContent();

  return (
    <div className="card flex flex-col gap-5 p-5 md:p-6">
      <p className="label text-[var(--c-ember)]">{t("hoursTitle")}</p>
      <ul className="flex flex-col gap-4">
        {content.site.hours.map((block) => (
          <li key={block.id}>
            <p className="flex items-center gap-2 font-display text-[1.15rem] text-[var(--fg)]">
              {pickText(block.label, locale)}
              {!block.confirmed ? (
                <span
                  title={t("pendingTitle")}
                  className="label rounded-full border border-dashed border-[var(--c-ember)]/60 px-2 py-0.5 text-[0.5rem] text-[var(--c-ember)]"
                >
                  {t("pendingTag")}
                </span>
              ) : null}
            </p>
            {block.days.length === 0 ? (
              <p className="mt-1 text-[0.9rem] text-[var(--fg-faint)]">{t("hoursPending")}</p>
            ) : (
              <ul className="mt-1.5 flex flex-col gap-1">
                {block.days.map((day) => (
                  <li key={day} className="flex items-baseline gap-2 text-[0.92rem]">
                    <span className="text-[var(--fg-muted)]">{formatWeekday(day, locale)}</span>
                    <span aria-hidden className="leader flex-1 translate-y-[-0.28em] text-[var(--line)]" />
                    <span className="price text-[0.86rem] text-[var(--fg)]">{formatInterval(block.open, block.close)}</span>
                  </li>
                ))}
              </ul>
            )}
            {block.note ? (
              <p className="mt-1.5 text-[0.82rem] leading-relaxed text-[var(--fg-faint)]">{pickText(block.note, locale)}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

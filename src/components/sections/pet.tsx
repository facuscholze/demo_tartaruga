import { getLocale, getTranslations } from "next-intl/server";
import { getSiteContent } from "@/features/content/load";
import { pickText } from "@/features/content/l10n";
import { Media } from "@/components/ui/media";

/**
 * Pet friendly: la huellitas se imprimen en la arena siguiendo el scroll
 * (`data-paw-trail` → ScrollTrigger en `scroll-fx`). La política real la
 * confirma el local: mientras tanto el bloque dice lo que hay que preguntar,
 * no lo que nosotros suponemos.
 */
export async function PetSection() {
  const locale = await getLocale();
  const t = await getTranslations("pet");
  const content = await getSiteContent();
  const shot = content.gallery.find((item) => item.section === "deck") ?? content.gallery[0];

  return (
    <section
      id="mascotas"
      aria-labelledby="pet-title"
      data-paw-trail
      className="relative isolate overflow-clip border-y border-[var(--line)] bg-[linear-gradient(180deg,var(--c-haze),var(--c-night))] py-20 md:py-24"
    >
      <div className="shell grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div>
          <p className="label text-[var(--c-cactus)]">{t("title")}</p>
          <h2 id="pet-title" data-reveal="words" className="mt-3 max-w-[16ch] text-[var(--text-h2)] text-[var(--fg)]">
            {t("title")}
          </h2>
          <p data-reveal="fade" className="mt-5 max-w-[52ch] text-[1rem] leading-relaxed text-[var(--fg-muted)]">
            {content.site.pending
              .filter((line) => /mascota|pet/i.test(JSON.stringify(line)))
              .map((line) => pickText(line, "es"))[0] ?? t("note")}
          </p>
          <p className="mt-4 max-w-[52ch] text-[0.92rem] leading-relaxed text-[var(--fg-faint)]">{t("note")}</p>
        </div>

        {shot ? (
          <figure data-reveal="mask" className="relative">
            <div className="aspect-[4/5] overflow-clip rounded-[4px] border border-[var(--line)]">
              <Media
                src={shot.image.src}
                alt={pickText(shot.alt, locale)}
                width={shot.image.width}
                height={shot.image.height}
                blurDataURL={shot.image.blurDataURL}
                sizes="(max-width: 768px) 88vw, 22rem"
              />
            </div>
            <span className="absolute -bottom-3 -left-3 h-full w-full -z-10 rounded-[4px] border border-dashed border-[var(--c-cactus)]/40" />
          </figure>
        ) : null}
      </div>

      {/* Huellitas en la arena: SVG con trazo, se rellenan al hacer scroll. */}
      <svg
        aria-hidden
        viewBox="0 0 900 90"
        className="paw-trail pointer-events-none absolute inset-x-0 bottom-0 h-[90px] w-full opacity-40"
        preserveAspectRatio="none"
      >
        <g className="paw-trail__prints" fill="none" stroke="var(--c-sand-wet)" strokeWidth="1.4" strokeLinecap="round">
          {Array.from({ length: 18 }, (_, i) => {
            const x = 26 + i * 49;
            const y = 54 + (i % 2 === 0 ? -18 : 14);
            return (
              <g key={i} transform={`translate(${x} ${y}) rotate(${i % 2 === 0 ? -14 : 12})`}>
                <ellipse cx="0" cy="4" rx="6.4" ry="7.6" />
                <circle cx="-6.4" cy="-6" r="2.3" />
                <circle cx="-1.6" cy="-9" r="2.3" />
                <circle cx="3.6" cy="-8.4" r="2.3" />
                <circle cx="7.6" cy="-4.6" r="2.1" />
              </g>
            );
          })}
        </g>
      </svg>
    </section>
  );
}

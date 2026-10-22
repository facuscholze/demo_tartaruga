import { getLocale, getTranslations } from "next-intl/server";
import { getSiteContent } from "@/features/content/load";
import { pickText } from "@/features/content/l10n";
import { formatDate } from "@/features/content/format";

/**
 * Beneficios: sale de `content/promos.json` y las promos con `validUntil`
 * pasado ni siquiera se renderizan (el filtro corre en `load.ts` con la fecha
 * de la ZONA DEL LOCAL, no la del visitante). Si no hay vigentes, la sección
 * entera desaparece del HTML.
 */
export async function PerksSection() {
  const locale = await getLocale();
  const t = await getTranslations("perks");
  const content = await getSiteContent();
  const promos = content.promos.filter((promo) => promo.activeNow && promo.active);
  if (promos.length === 0) return null;

  return (
    <section id="beneficios" aria-labelledby="perks-title" className="relative isolate py-18 md:py-20">
      <div className="shell flex flex-col gap-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="perks-title" data-reveal="words" className="text-[var(--text-h2)] text-[var(--fg)]">
            {t("title")}
          </h2>
          <p className="label text-[var(--fg-faint)]">
            {locale.startsWith("en")
              ? "Automatic: expired promos drop out of the build"
              : "Automático: las promos vencidas salen de la build"}
          </p>
        </header>

        <ul className="grid gap-4 md:grid-cols-2">
          {promos.map((promo) => (
            <li key={promo.id} data-reveal="mask">
              <article className="card flex flex-col gap-3 p-5 md:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[1.28rem] leading-snug text-[var(--fg)]">{pickText(promo.title, locale)}</h3>
                  {promo.pending ? (
                    <span className="label rounded-full border border-dashed border-[var(--c-ember)]/60 px-2 py-1 text-[0.5rem] text-[var(--c-ember)]">
                      {t("pending")}
                    </span>
                  ) : null}
                </div>
                {promo.details ? (
                  <p className="max-w-[54ch] text-[0.93rem] leading-relaxed text-[var(--fg-muted)]">
                    {pickText(promo.details, locale)}
                  </p>
                ) : null}
                <p className="label text-[0.55rem] text-[var(--fg-faint)]">
                  {t("validUntil", { date: formatDate(promo.validUntil, locale, content.site.timezone) })}
                </p>
                {promo.terms ? (
                  <p className="border-t border-[var(--line)] pt-3 text-[0.78rem] leading-relaxed text-[var(--fg-faint)]">
                    {pickText(promo.terms, locale)}
                  </p>
                ) : null}
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

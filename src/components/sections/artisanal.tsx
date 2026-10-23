import { getLocale, getTranslations } from "next-intl/server";
import { getSiteContent } from "@/features/content/load";
import { pickText } from "@/features/content/l10n";
import { ShellIcon } from "@/components/brand/shell-icon";
import { withBase } from "@/lib/base";

/**
 * Artesanal: el diferencial "hecho acá". No contamos una historia que no nos
 * contaron: el bloque está marcado como provisorio y pide el dato real, con el
 * mismo estilo de sello grabado que usa la carta.
 */
export async function ArtisanalSection() {
  const locale = await getLocale();
  const t = await getTranslations("artisanal");
  const content = await getSiteContent();
  const note = content.menu.note ? pickText(content.menu.note, locale) : "";

  return (
    <section
      id="artesanal"
      aria-labelledby="art-title"
      data-surface="sand"
      className="paper relative isolate overflow-clip py-20 text-[var(--paper-ink)] md:py-24"
    >
      <div className="shell grid gap-10 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <div>
          <p className="label flex items-center gap-2 text-[var(--c-rust)]">
            <ShellIcon src={withBase("/images/icons/estrella-1.svg")} className="h-4 w-4" />
            {t("title")}
          </p>
          <h2
            id="art-title"
            data-reveal="words"
            className="mt-3 text-[var(--text-display)] text-[var(--paper-ink)]"
          >
            {t("title")}
          </h2>
        </div>

        <div className="flex flex-col gap-6">
          <p
            data-reveal="fade"
            className="max-w-[58ch] text-[1.02rem] leading-relaxed text-[var(--paper-muted)]"
          >
            {note || t("note")}
          </p>
          <ul className="grid gap-3 sm:grid-cols-3">
            {(
              [
                {
                  es: ["Pan y masa madre", "Horneado en el día, a leña cuando el viento deja."],
                  en: ["Sourdough daily", "Baked in-house, wood-fired when the wind allows."],
                },
                {
                  es: [
                    "Conservas propias",
                    "Escabeches y encurtidos de la temporada, en frasco rotulado a mano.",
                  ],
                  en: ["House preserves", "Seasonal escabeche and pickles, hand-labeled jars."],
                },
                {
                  es: [
                    "Fuego lento",
                    "La brasa no tiene apuro: el menú acompaña lo que da el día.",
                  ],
                  en: ["Slow fire", "Embers don't rush: the menu follows the day."],
                },
              ] as { es: [string, string]; en: [string, string] }[]
            ).map((card, index) => {
              const lang = locale.startsWith("en") ? "en" : "es";
              const [title, body] = card[lang];
              return (
                <li
                  key={index}
                  className="stamp-edge bg-[color-mix(in_oklab,var(--c-bone)_58%,transparent)] p-4"
                >
                  <p className="font-display text-[1.06rem] text-[var(--paper-ink)]">{title}</p>
                  <p className="mt-1.5 text-[0.86rem] leading-relaxed text-[var(--paper-muted)]">
                    {body}
                  </p>
                </li>
              );
            })}
          </ul>
          <p className="label text-[0.55rem] text-[var(--c-rust)]">
            {locale.startsWith("en")
              ? "Provisional copy · to be defined with the venue"
              : "Copy provisorio · a definir con el local"}
          </p>
        </div>
      </div>
    </section>
  );
}

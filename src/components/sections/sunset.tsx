import { getLocale, getTranslations } from "next-intl/server";
import { getSiteContent } from "@/features/content/load";
import { pickText } from "@/features/content/l10n";
import { buildSnapshot, quickReserveMessage, whatsappHref } from "@/features/site/links";
import { Media } from "@/components/ui/media";

/**
 * Sunset a pantalla completa: tres capas con parallax diferencial (cielo,
 * médanos, mesa) y el título entrando por máscara. Se fija mientras se recorre
 * (`data-pin`) y sale sola — sin secuestros de scroll eternos.
 *
 * Nota de perf: el parallax es `scrub` sobre 3 elementos; si el device está en
 * tier low, `scroll-fx.tsx` no registra el trigger (lo decide `settings.parallax`).
 */
export async function SunsetSection() {
  const locale = await getLocale();
  const t = await getTranslations("sunset");
  const content = await getSiteContent();
  const snapshot = buildSnapshot(content.site);
  const shots = content.gallery.filter((item) => item.section === "sunset");
  const back = shots[0];
  const front = shots[1] ?? shots[0];

  return (
    <section
      id="sunset"
      data-pin
      aria-labelledby="sunset-title"
      className="relative isolate flex min-h-[105svh] flex-col justify-end overflow-clip border-t border-[var(--line)] bg-[var(--c-abyss)]"
    >
      {/* Capa 1: el cielo/foto de fondo, desfasada a la mitad de velocidad. */}
      {back ? (
        <div data-parallax="0.06" className="absolute inset-x-0 -top-[12%] -z-20 h-[124%] w-full">
          <div
            className="h-full w-full bg-cover bg-center opacity-60"
            style={{ backgroundImage: `url(${back.image.src ?? "/images/_fallback/placeholder.svg"})` }}
            aria-hidden
          />
        </div>
      ) : null}

      {/* Capa 2: gradiente del cielo real de esa hora, multiplicando la foto. */}
      <div className="sky-veil absolute inset-0 -z-10" aria-hidden />
      <div className="vignette-warm absolute inset-x-0 bottom-0 -z-10 h-[70%]" aria-hidden />

      <div className="shell relative z-[3] flex flex-col gap-9 pb-16">
        <p className="label text-[var(--c-spark)]">{t("title")}</p>
        <h2 id="sunset-title" data-reveal="words" className="max-w-[14ch] text-[var(--text-display)] text-[var(--fg)]">
          {t("title")}
        </h2>
        <div className="flex flex-wrap items-end justify-between gap-8">
          <p data-reveal="fade" className="max-w-[40ch] text-[1.05rem] leading-relaxed text-[var(--fg-muted)]">
            {t("text")}
          </p>

          {front ? (
            <figure data-reveal="mask" className="w-[min(30rem,72vw)] shrink-0">
              <div className="aspect-[4/5] overflow-clip rounded-[4px] border border-[var(--line)] sm:aspect-[5/4]">
                <Media
                  src={front.image.src}
                  alt={pickText(front.alt, locale)}
                  width={front.image.width}
                  height={front.image.height}
                  blurDataURL={front.image.blurDataURL}
                  sizes="(max-width: 768px) 88vw, 30rem"
                />
              </div>
              {front.caption ? (
                <figcaption className="label mt-2 text-[0.55rem] text-[var(--fg-faint)]">
                  {pickText(front.caption, locale)}
                </figcaption>
              ) : null}
            </figure>
          ) : null}
        </div>

        <a
          href={whatsappHref(snapshot, quickReserveMessage(snapshot.name, locale))}
          target="_blank"
          rel="noopener noreferrer"
          className="btn self-start"
          data-cursor="reservar"
        >
          {t("title")} · {locale.startsWith("en") ? "Book" : locale.startsWith("pt") ? "Reservar" : "Reservar"}
        </a>
      </div>
    </section>
  );
}

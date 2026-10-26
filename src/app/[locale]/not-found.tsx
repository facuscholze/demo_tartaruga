import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TurtleMark } from "@/components/brand/turtle";
import { Media } from "@/components/ui/media";
import { getSiteContent } from "@/features/content/load";

/**
 * 404: la tortuga varada en la arena, boca abajo. Es un easter egg, pero el
 * bloque sigue siendo útil: dice dónde volver y mantiene el cielo del sitio.
 */
export default async function NotFound() {
  const t = await getTranslations("notFound");
  const content = await getSiteContent();
  const shot = content.gallery[0];

  return (
    <main
      id="main"
      className="relative isolate flex min-h-[100svh] flex-col items-center justify-center overflow-clip px-6 py-24 text-center"
    >
      <div className="sky-gradient absolute inset-0 -z-20" aria-hidden />
      <div className="grain absolute inset-0 -z-10" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-[42%] bg-[linear-gradient(to_top,color-mix(in_oklab,var(--c-sand-wet)_38%,var(--c-night)),transparent)]" />

      <div className="relative flex flex-col items-center gap-8">
        <p className="label text-[var(--c-spark)]">404</p>
        <div className="relative w-[min(64vw,20rem)] rotate-180 opacity-90 [filter:drop-shadow(0_18px_28px_rgba(0,0,0,0.45))]">
          <TurtleMark
            className="w-full text-[var(--c-bone)]"
            stroke={4}
            animated={false}
            title=""
          />
        </div>
        <h1 className="max-w-[18ch] text-[var(--text-display)] text-[var(--fg)]">{t("title")}</h1>
        <p className="max-w-[46ch] text-[1rem] leading-relaxed text-[var(--fg-muted)]">
          {t("text")}
        </p>
        <Link href="/" className="btn mt-2" data-cursor="reservar">
          {t("back")}
        </Link>
      </div>

      {shot?.image.src ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-30 h-[60%] opacity-25">
          <Media
            src={shot.image.src}
            alt=""
            width={shot.image.width}
            height={shot.image.height}
            fill
            sizes="100vw"
          />
        </div>
      ) : null}
    </main>
  );
}

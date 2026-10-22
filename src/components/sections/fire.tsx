import { getTranslations } from "next-intl/server";
import { FireCanvas } from "@/components/sections/fire-canvas";
import { SoundLayers } from "@/components/controls/sound-layers";
import { getSiteContent } from "@/features/content/load";
import { pickText } from "@/features/content/l10n";

/**
 * Fuego: la firma emocional del sitio. WebGL en high/medium, brasas CSS que
 * "respiran" en low (y con el audio prendido, laten con las olas).
 */
export async function FireSection() {
  const t = await getTranslations("fire");
  const content = await getSiteContent();
  const gallery = content.gallery.filter((item) => item.section === "fuego");
  const first = gallery[0];

  return (
    <section
      id="fuego"
      data-fire
      aria-labelledby="fuego-title"
      className="relative isolate flex min-h-[78svh] flex-col justify-end overflow-clip border-y border-[var(--line)] bg-[var(--c-abyss)] pb-16 pt-24"
    >
      {first ? (
        <div className="absolute inset-0 -z-10 opacity-45">
          <div data-parallax="0.06" className="h-full w-full">
            {/* El fondo se ilumina desde abajo: la brasa manda la luz del bloque. */}
            <div
              className="h-full w-full bg-cover bg-center"
              style={{
                backgroundImage: `url(${first.image.src ?? "/images/_fallback/placeholder.svg"})`,
              }}
              aria-hidden
            />
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(to_top,var(--c-abyss)_6%,color-mix(in_oklab,var(--c-abyss)_72%,transparent)_52%,transparent)]" />
        </div>
      ) : null}

      <FireCanvas className="absolute inset-x-0 bottom-0 -z-[5] h-[68%] w-full" />

      <div className="shell relative z-[4] flex flex-col gap-8">
        <p className="label text-[var(--c-ember)]">{t("caption")}</p>
        <h2 id="fuego-title" className="max-w-[16ch] text-[var(--text-display)] text-[var(--fg)]">
          {t("title")}
        </h2>
        <div className="flex flex-wrap items-end justify-between gap-8">
          <p
            data-reveal="fade"
            className="max-w-[42ch] text-[1.05rem] leading-relaxed text-[var(--fg-muted)]"
          >
            {pickText(content.menu.note, "es") ? "" : ""}
            {t("text")}
          </p>
          <SoundLayers />
        </div>
      </div>
    </section>
  );
}

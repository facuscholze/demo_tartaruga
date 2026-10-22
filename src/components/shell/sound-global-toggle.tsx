"use client";

/**
 * Mute global SIEMPRE visible (requisito de accesibilidad del brief): un punto
 * de control fijo, independientemente de qué sección estés viendo.
 */
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAmbience } from "@/features/audio/store";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export function SoundGlobalToggle() {
  const t = useTranslations("controls");
  const enabled = useAmbience((state) => state.enabled);
  const toggle = useAmbience((state) => state.toggle);
  const suspend = useAmbience((state) => state.suspendForBackground);
  const resume = useAmbience((state) => state.resumeFromBackground);

  useEffect(() => {
    const onVisibility = () => (document.visibilityState === "hidden" ? suspend() : resume());
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [suspend, resume]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      title={enabled ? t("mute") : t("soundOff")}
      className={cn(
        "fixed bottom-[calc(0.6rem+env(safe-area-inset-bottom))] right-3 z-[60] grid h-11 w-11 place-items-center rounded-full border backdrop-blur-md transition-colors duration-[var(--d-2)] md:bottom-4 md:right-4",
        enabled
          ? "border-[color-mix(in_oklab,var(--c-ember)_55%,transparent)] bg-[color-mix(in_oklab,var(--c-ember)_18%,var(--c-night))] text-[var(--c-spark)]"
          : "border-[var(--line)] bg-[color-mix(in_oklab,var(--c-navy)_60%,transparent)] text-[var(--fg-muted)] hover:text-[var(--fg)]",
      )}
    >
      <Icon name={enabled ? "sound-on" : "sound-off"} size={19} />
      <span className="sr-only">{enabled ? t("mute") : t("sound")}</span>
      {enabled ? (
        <span
          className="absolute inset-0 -z-10 rounded-full bg-[radial-gradient(circle,rgba(245,169,75,0.25),transparent_70%)]"
          data-sound-pulse
        />
      ) : null}
    </button>
  );
}

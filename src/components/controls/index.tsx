"use client";

/** Barra de controles persistentes: sonido, efectos y hora del día. */
import { useTranslations } from "next-intl";
import { ToggleGroup, type Option } from "@/components/ui/toggle-group";
import { useAmbience } from "@/features/audio/store";
import { useQualityStore } from "@/features/quality/store";
import { QUALITY_LABELS, type Quality } from "@/features/quality/tiers";
import { useSkyStore } from "@/features/sky/store";
import type { SkyMode } from "@/features/sky/palettes";
import { cn } from "@/lib/utils";

export function SoundToggle({ className }: { className?: string }) {
  const t = useTranslations("controls");
  const enabled = useAmbience((state) => state.enabled);
  const toggle = useAmbience((state) => state.toggle);
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      title={enabled ? t("soundOn") : t("soundOff")}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-3 py-2 backdrop-blur-[6px] transition-colors duration-[var(--d-2)]",
        enabled
          ? "border-[color-mix(in_oklab,var(--c-ember)_60%,transparent)] bg-[color-mix(in_oklab,var(--c-ember)_16%,transparent)]"
          : "bg-[color-mix(in_oklab,var(--c-navy)_46%,transparent)]",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("transition-opacity", enabled && "animate-pulse-none")}
        data-sound-icon
      >
        {enabled ? "◉" : "○"}
      </span>
      <span className="label">{t("sound")}</span>
      <span className="sr-only">{enabled ? t("soundOn") : t("soundOff")}</span>
    </button>
  );
}

export function EffectsToggle({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("controls");
  const quality = useQualityStore((state) => state.quality);
  const setQuality = useQualityStore((state) => state.setQuality);
  const options: Option<Quality>[] = [
    { value: "high", label: t("effectsMax") },
    { value: "medium", label: t("effectsNormal") },
    { value: "low", label: t("effectsMin") },
  ];
  return (
    <div className="flex items-center gap-2">
      {!compact && <span className="label text-[var(--fg-faint)]">{t("effects")}</span>}
      <ToggleGroup
        options={options}
        value={quality}
        onChange={(value) => setQuality(value)}
        label={t("effects")}
        size="sm"
      />
    </div>
  );
}

export function TimeOfDaySelect() {
  const t = useTranslations("hero.tod");
  const mode = useSkyStore((state) => state.mode);
  const setMode = useSkyStore((state) => state.setMode);
  const options: Option<SkyMode>[] = [
    { value: "auto", label: t("auto"), title: "Real" },
    { value: "morning", label: t("morning") },
    { value: "afternoon", label: t("afternoon") },
    { value: "sunset", label: t("sunset") },
    { value: "night", label: t("night") },
  ];
  return (
    <ToggleGroup options={options} value={mode} onChange={setMode} label={t("label")} size="sm" />
  );
}

export { QUALITY_LABELS };

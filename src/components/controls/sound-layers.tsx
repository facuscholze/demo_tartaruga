"use client";

/**
 * Control fino del ambiente: olas / fuego / brisa, cada una con su ganancia.
 * Sigue siendo 100% opt-in: si el audio no está prendido, estos toggles lo
 * prenden al primer click (que es un gesto, así que el navegador lo permite).
 */
import { useTranslations } from "next-intl";
import { useAmbience } from "@/features/audio/store";
import type { AmbienceLayer } from "@/features/audio/engine";
import { cn } from "@/lib/utils";

const LAYERS: { id: AmbienceLayer; label: string }[] = [
  { id: "olas", label: "Olas" },
  { id: "fuego", label: "Fuego" },
  { id: "brisa", label: "Brisa" },
];

export function SoundLayers({ className }: { className?: string }) {
  const t = useTranslations("controls");
  const { enabled, layers, volume, toggleLayer, enable, setVolume } = useAmbience();

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <div className="flex items-center gap-1.5" role="group" aria-label={t("sound")}>
        {LAYERS.map((layer) => (
          <button
            key={layer.id}
            type="button"
            aria-pressed={enabled && layers[layer.id]}
            onClick={() => {
              if (!enabled) void enable(volume);
              toggleLayer(layer.id);
            }}
            className={cn(
              "label rounded-full border px-2.5 py-1.5 transition-colors duration-[var(--d-2)]",
              enabled && layers[layer.id]
                ? "border-[color-mix(in_oklab,var(--c-ember)_55%,transparent)] bg-[color-mix(in_oklab,var(--c-ember)_14%,transparent)] text-[var(--c-spark)]"
                : "border-[var(--line)] text-[var(--fg-muted)] hover:text-[var(--fg)]",
            )}
          >
            {layer.label}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2">
        <span className="label text-[var(--fg-faint)]">{t("sound")}</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
          className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-[var(--line)] accent-[var(--c-ember)]"
          aria-label={`${t("sound")} · %`}
        />
      </label>
    </div>
  );
}

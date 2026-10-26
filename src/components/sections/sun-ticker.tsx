"use client";

/**
 * "Hoy el sol se pone a las HH:MM" con datos REALES de SunCalc para Punta
 * Colorada. Se refresca cada minuto y anuncia el cambio por `aria-live`.
 */
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSite } from "@/features/site/context";
import {
  formatClock,
  formatCountdown,
  getSunInfo,
  todFromElevation,
  type SunInfo,
} from "@/features/sky/sun";

export function SunTicker() {
  const t = useTranslations("hero");
  const site = useSite();
  const [sun, setSun] = useState<SunInfo | null>(null);

  useEffect(() => {
    const tick = () => setSun(getSunInfo(new Date(), site.coords, site.timezone));
    tick();
    const interval = window.setInterval(tick, 60_000);
    return () => window.clearInterval(interval);
  }, [site.coords, site.timezone]);

  const now = typeof window !== "undefined" ? formatClock(new Date(), site.timezone) : "";
  const minutes = sun?.minutesToSunset ?? 0;
  const isSet = minutes < 0;

  return (
    <dl className="flex flex-wrap items-end gap-x-8 gap-y-3" aria-live="polite">
      <div>
        <dt className="label text-[var(--fg-faint)]">{t("sunsetLabel")}</dt>
        <dd className="m-0 font-type text-2xl tabular-nums text-[var(--fg)] sm:text-3xl">
          {sun?.sunsetLabel ?? "—"}
          {sun && (
            <span className="ml-3 align-middle text-[0.62em] text-[var(--fg-muted)]">
              {isSet ? formatCountdown(minutes) : `en ${formatCountdown(minutes)}`}
            </span>
          )}
        </dd>
      </div>
      <div>
        <dt className="label text-[var(--fg-faint)]">{t("sunriseLabel")}</dt>
        <dd className="m-0 font-type text-lg tabular-nums text-[var(--fg-muted)]">
          {sun?.sunriseLabel ?? "—"}
        </dd>
      </div>
      <div>
        <dt className="label text-[var(--fg-faint)]">{t("nowLabel")}</dt>
        <dd className="m-0 font-type text-lg tabular-nums text-[var(--fg-muted)]">
          {now}
          {sun && <span className="ml-2 opacity-70">· {todFromElevation(sun.elevation)}</span>}
        </dd>
      </div>
      <p className="label w-full text-[0.6rem] text-[var(--fg-faint)]">
        {`${site.coords.lat.toFixed(4)}, ${site.coords.lng.toFixed(4)} · ${site.timezone}`}
      </p>
    </dl>
  );
}

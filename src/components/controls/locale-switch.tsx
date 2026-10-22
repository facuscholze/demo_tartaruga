"use client";

/** Selector de idioma: mantiene la ruta y cambia solo el prefijo. */
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = { es: "ES", en: "EN", pt: "PT" };

export function LocaleSwitch({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-full border border-[var(--line)] p-0.5",
        className,
      )}
      role="group"
      aria-label={t("language")}
    >
      {routing.locales.map((option) => (
        <button
          key={option}
          type="button"
          aria-current={option === locale}
          onClick={() => router.replace(pathname, { locale: option })}
          className={cn(
            "rounded-full px-2 py-1 font-type text-[0.62rem] uppercase tracking-[0.14em] transition-colors duration-[var(--d-2)]",
            option === locale
              ? "bg-[var(--fg)] text-[var(--c-navy)]"
              : "text-[var(--fg-muted)] hover:text-[var(--fg)]",
          )}
        >
          {LABELS[option] ?? option.toUpperCase()}
          <span className="sr-only">{` · ${t("language")}`}</span>
        </button>
      ))}
    </div>
  );
}

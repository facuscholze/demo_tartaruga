"use client";

/**
 * Header sticky con el CTA de reserva siempre a mano, selector de idioma,
 * sonido, efectos y hora del día. Se compacta al scrollear (sin esconderse: el
 * botón RESERVAR no debe desaparecer nunca, es la conversión).
 */
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { TurtleMark } from "@/components/brand/turtle";
import { ButtonLink } from "@/components/ui/button-link";
import { Icon } from "@/components/ui/icon";
import { EffectsToggle, SoundToggle, TimeOfDaySelect } from "@/components/controls";
import { LocaleSwitch } from "@/components/controls/locale-switch";
import { useLenis } from "@/hooks/use-lenis";

const NAV = [
  { id: "carta", labelKey: "menu" },
  { id: "lugar", labelKey: "place" },
  { id: "sunset", labelKey: "sunset" },
  { id: "experiencias", labelKey: "experiences" },
  { id: "beneficios", labelKey: "perks" },
  { id: "visitar", labelKey: "visit" },
] as const;

export function Header({ reserveHref }: { reserveHref: string }) {
  const t = useTranslations("nav");
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollTo } = useLenis();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-[var(--d-3)] ${
        compact
          ? "border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--c-night)_78%,transparent)] backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      <div className="shell flex h-[var(--header-h)] items-center gap-4">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label={`${t("reserve")} — Tartaruga`}>
          <TurtleMark className="h-7 w-auto text-[var(--fg)] transition-transform duration-[var(--d-4)] group-hover:-rotate-6" stroke={9} />
          <span className="hidden font-display text-[1.02rem] leading-none tracking-[0.02em] text-[var(--fg)] sm:block">
            Tartaruga<span className="text-[var(--fg-faint)]"> sea-bar</span>
          </span>
        </Link>

        <nav aria-label={t("language")} className="ml-4 hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              data-scroll-to
              className="label rounded-full px-2.5 py-2 text-[var(--fg-muted)] transition-colors hover:bg-[color-mix(in_oklab,var(--c-bone)_8%,transparent)] hover:text-[var(--fg)]"
            >
              {t(item.labelKey)}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 xl:flex">
            <TimeOfDaySelect />
            <EffectsToggle compact />
            <SoundToggle />
          </div>
          <LocaleSwitch />
          <ButtonLink href={reserveHref} dataCursor="reservar" className="shrink-0 px-4 py-2.5 text-[0.64rem]">
            <Icon name="whatsapp" size={15} />
            <span>{t("reserve")}</span>
          </ButtonLink>
          <button
            type="button"
            className="btn btn-ghost !px-3 py-2.5 lg:hidden"
            aria-expanded={open}
            aria-controls="nav-drawer"
            onClick={() => setOpen((value) => !value)}
          >
            <Icon name={open ? "close" : "menu"} size={18} />
            <span className="sr-only">{open ? t("closeMenu") : t("openMenu")}</span>
          </button>
        </div>
      </div>

      {open ? (
        <div id="nav-drawer" className="border-t border-[var(--line)] bg-[color-mix(in_oklab,var(--c-night)_94%,transparent)] backdrop-blur-xl lg:hidden">
          <div className="shell flex flex-col gap-1 py-4">
            {NAV.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                data-scroll-to
                onClick={() => setOpen(false)}
                className="label flex items-center justify-between rounded-xl px-3 py-3 text-sm text-[var(--fg)] transition-colors hover:bg-[color-mix(in_oklab,var(--c-bone)_8%,transparent)]"
              >
                {t(item.labelKey)}
                <Icon name="arrow-right" size={16} />
              </a>
            ))}
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-3">
              <TimeOfDaySelect />
              <SoundToggle />
              <EffectsToggle compact />
            </div>
          </div>
        </div>
      ) : null}
      <span className="sr-only" aria-live="polite">
        {pathname === "/" ? "" : ""}
      </span>
      <style>{`[data-scroll-to]{scroll-margin-top:var(--header-h)}`}</style>
      <span className="hidden">{typeof scrollTo === "function" ? "" : ""}</span>
    </header>
  );
}

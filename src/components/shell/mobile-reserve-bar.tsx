"use client";

/** Barra inferior en móvil: la reserva a un pulgar de distancia, siempre. */
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";

export function MobileReserveBar({ reserveHref }: { reserveHref: string }) {
  const t = useTranslations("nav");
  const [hidden, setHidden] = useState(false);
  const [inHero, setInHero] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHidden((current) => {
        const next = y > 1400 && current === false ? false : current;
        return next;
      });
      setInHero(y < window.innerHeight * 0.75);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      data-mobile-bar
      className={`fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-[var(--line)] bg-[color-mix(in_oklab,var(--c-night)_88%,transparent)] px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl transition-transform duration-[var(--d-3)] ease-[var(--ease-sea)] md:hidden ${
        hidden ? "translate-y-full" : ""
      }`}
      style={{ transform: inHero ? "translateY(0)" : undefined }}
    >
      <a href={reserveHref} target="_blank" rel="noopener noreferrer" className="btn grow">
        <Icon name="whatsapp" size={16} />
        {t("reserve")}
      </a>
    </div>
  );
}

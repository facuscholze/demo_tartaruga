"use client";

/**
 * Intro no bloqueante: la tortuga se dibuja (DrawSVG) sobre el azul del logo y
 * el velo se abre como un sol que sube.
 *
 * Reglas que la hacen segura:
 *  - el contenido real ya está pintado DEBAJO desde el servidor (no es un loader
 *    que tapa un vacío: es un prólogo de 1.5 s como máximo);
 *  - `prefers-reduced-motion` o segunda visita en la sesión → no se muestra;
 *  - cualquier tecla o click la salta, y a los 1500 ms se va sola;
 *  - el audio solo arranca si el usuario elige "con sonido" (nunca autoplay).
 */
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { TurtleMark } from "@/components/brand/turtle";
import { useAmbience } from "@/features/audio/store";

const STORAGE_KEY = "tartaruga-intro";
type Phase = "hidden" | "draw" | "open" | "gone";

/** Se decide una sola vez, en el primer render del cliente. */
function shouldShowIntro(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    return sessionStorage.getItem(STORAGE_KEY) !== "done";
  } catch {
    return true;
  }
}

export function Intro() {
  const t = useTranslations("intro");
  const enable = useAmbience((state) => state.enable);
  const [phase, setPhase] = useState<Phase>("hidden");
  const veilRef = useRef<HTMLDivElement>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (!shouldShowIntro()) {
      document.documentElement.dataset.introPending = "false";
      return;
    }
    setPhase("draw");
    document.documentElement.dataset.introPending = "true";

    let timer = 0;
    let disposed = false;

    void import("@/lib/gsap").then((gsapModule) => {
      if (disposed) return;
      gsapModule.setupGsap();
      const { gsap } = gsapModule;
      const timeline = gsap.timeline();
      timeline
        .fromTo(
          "[data-intro-turtle] path",
          { drawSVG: "0%" },
          { drawSVG: "100%", duration: 0.95, stagger: 0.03, ease: "sea" },
        )
        .to("[data-intro-turtle] circle", { opacity: 1, duration: 0.3 }, "-=0.25")
        .to("[data-intro-label]", { opacity: 1, y: 0, duration: 0.5 }, "-=0.5");
      // Corte de seguridad: la intro se va sola, elija lo que elija el visitante.
      timer = window.setTimeout(() => void close(false), 1500);
    });

    const onKey = (event: KeyboardEvent) => {
      if (["Escape", "Enter", " "].includes(event.key)) void close(false);
    };
    window.addEventListener("keydown", onKey);

    async function close(withSound: boolean) {
      if (finishedRef.current) return;
      finishedRef.current = true;
      try {
        sessionStorage.setItem(STORAGE_KEY, "done");
      } catch {
        /* modo privado: no pasa nada */
      }
      if (withSound) await enable(0.45);
      document.documentElement.dataset.introPending = "false";
      setPhase("open");
      const gsapModule = await import("@/lib/gsap");
      gsapModule.setupGsap();
      gsapModule.gsap.to(veilRef.current, {
        clipPath: "inset(0 0 100% 0)",
        opacity: 0,
        duration: 0.85,
        ease: "swell",
        onComplete: () => setPhase("gone"),
      });
    }

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
    // `enable` y las traducciones no cambian nunca en la vida del overlay.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "hidden" || phase === "gone") return null;

  return (
    <div
      ref={veilRef}
      data-intro
      aria-label={t("headline")}
      className="fixed inset-0 z-[80] grid place-items-center bg-[var(--c-navy)] [clip-path:inset(0_0_0_0)]"
      onClick={() => void closeWithoutSound()}
    >
      <div className="flex flex-col items-center gap-7 px-8 text-center">
        <span data-intro-turtle className="block w-[min(58vw,17rem)] text-[var(--c-bone)]">
          <TurtleMark className="w-full" stroke={4.2} animated />
        </span>
        <p data-intro-label className="label translate-y-2 opacity-0">
          {t("headline")}
        </p>
        <div
          className="flex flex-wrap items-center justify-center gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          <button type="button" className="btn" onClick={() => void enter(true)}>
            {t("withSound")}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => void enter(false)}>
            {t("withoutSound")}
          </button>
          <button
            type="button"
            className="label ml-2 text-[var(--fg-faint)] underline underline-offset-4 hover:text-[var(--fg)]"
            onClick={() => void enter(false)}
          >
            {t("skip")}
          </button>
        </div>
        <p className="label max-w-[34ch] text-[0.58rem] leading-relaxed text-[var(--fg-faint)]">
          {t("soundHint")}
        </p>
      </div>
      <span className="sr-only" role="status">
        {t("loading")}
      </span>
    </div>
  );

  /** Cierre compartido: `enter` desde los botones, `close` desde el timer. */
  async function enter(withSound: boolean) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    try {
      sessionStorage.setItem(STORAGE_KEY, "done");
    } catch {
      /* noop */
    }
    if (withSound) await enable(0.45);
    document.documentElement.dataset.introPending = "false";
    setPhase("open");
    const gsapModule = await import("@/lib/gsap");
    gsapModule.setupGsap();
    gsapModule.gsap.to(veilRef.current, {
      clipPath: "inset(0 0 100% 0)",
      opacity: 0,
      duration: 0.85,
      ease: "swell",
      onComplete: () => setPhase("gone"),
    });
  }

  function closeWithoutSound() {
    return enter(false);
  }
}

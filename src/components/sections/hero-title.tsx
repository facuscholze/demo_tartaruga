"use client";

/**
 * Título gigante "TARTARUGA SEA-BAR". El servidor pinta el texto real y
 * completo (legible y cacheable sin JS); GSAP SplitText solo lo parte y lo
 * anima al entrar. Con `prefers-reduced-motion` o tier `low` no se toca el DOM.
 */
import { useEffect, useRef } from "react";
import { TurtleMark } from "@/components/brand/turtle";

export function HeroTitle({ title, claim }: { title: string; claim: string }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || root.dataset.quality === "low") return;

    let cancelled = false;
    let split: { revert?: () => void } | null = null;

    void (async () => {
      const gsapModule = await import("@/lib/gsap");
      gsapModule.setupGsap();
      if (cancelled || !ref.current) return;
      const { gsap, SplitText } = gsapModule;

      const instance = new SplitText(node, {
        type: "lines,words",
        linesClass: "hero-line",
        wordsClass: "hero-word",
      });
      split = instance as unknown as { revert?: () => void };

      gsap.set(instance.lines, { y: "0.5em", opacity: 0 });
      const timeline = gsap.timeline({ delay: 0.12 });
      timeline.to(instance.lines, {
        y: 0,
        opacity: 1,
        duration: 1.15,
        ease: "sea",
        stagger: 0.085,
      });
      timeline.to(
        "[data-hero-claim]",
        { opacity: 1, y: 0, duration: 0.9, ease: "sea" },
        "-=0.65",
      );
      timeline.to(
        "[data-hero-turtle]",
        { opacity: 1, scale: 1, rotate: 0, duration: 1.5, ease: "sea" },
        "-=1.05",
      );
    })();

    return () => {
      cancelled = true;
      split?.revert?.();
    };
  }, []);

  return (
    <h1
      ref={ref}
      data-hero-title
      className="relative m-0 font-display font-light leading-[0.82] tracking-[var(--tracking-display)] text-[var(--fg)] [font-variation-settings:'SOFT'_55,'WONK'_1,'opsz'_144]"
      style={{ fontSize: "var(--text-hero)" }}
    >
      <span className="block">TARTARUGA</span>
      <span className="block text-[0.44em] tracking-[0.02em]">
        <span className="inline-block align-middle italic text-[var(--accent)]">sea</span>
        <span className="inline-block align-middle">-bar</span>
        <span
          data-hero-turtle
          className="ml-[0.35em] inline-block w-[0.5em] align-middle opacity-0"
          aria-hidden
        >
          <TurtleMark className="w-full" stroke={5} title="" />
        </span>
      </span>
      <span className="sr-only">{`${title} — ${claim}`}</span>
      <span data-hero-claim className="mt-6 block max-w-[26ch] font-body text-[clamp(1rem,1.4vw,1.28rem)] leading-snug tracking-normal text-[var(--fg-muted)] opacity-0">
        {claim}
      </span>
    </h1>
  );
}

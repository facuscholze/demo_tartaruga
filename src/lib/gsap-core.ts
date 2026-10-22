/**
 * Núcleo de GSAP: lo que necesita el scroll global (Lenis sincronizado con
 * ScrollTrigger) sin arrastrar los plugins pesados al primer chunk.
 *
 * Se registra en un único módulo para que ningún componente de sección registre
 * de más. Las coreografías con SplitText / Flip / DrawSVG / Observer se cargan
 * desde `@/lib/gsap`, que importa de acá.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";

let registered = false;

export type EaseName = "sea" | "swell" | "ember";

/** Curvas espejo de `--ease-*` en tokens.css: misma sensación en JS y CSS. */
const EASES: Record<EaseName, string> = {
  sea: "0.16,0.84,0.24,1",
  swell: "0.62,0,0.12,1",
  ember: "0.3,0.7,0.2,1.02",
};

export function setupGsapCore(): typeof gsap {
  if (registered) return gsap;
  registered = true;
  gsap.registerPlugin(ScrollTrigger, CustomEase);

  (Object.keys(EASES) as EaseName[]).forEach((name) => {
    if (!gsap.parseEase(name)) CustomEase.create(name, `M0,0 C${EASES[name]} 1,1`);
  });

  gsap.defaults({ ease: "sea", duration: 0.9 });
  return gsap;
}

export { gsap, ScrollTrigger, CustomEase };

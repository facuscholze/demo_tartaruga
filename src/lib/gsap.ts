/**
 * GSAP en un único punto: los plugins se registran una sola vez y todos los
 * componentes importan de acá (así ningún bundle de sección registra de más).
 *
 * Convención del proyecto (documentada en CLAUDE.md):
 *  - GSAP  → scroll (ScrollTrigger), coreografías, SplitText, Flip, DrawSVG,
 *            MorphSVG, Observer, easings.
 *  - Motion → SOLO transiciones de layout/gesto de componentes React
 *            (diálogos, indicador de tabs, drag de sheets).
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { CustomEase } from "gsap/CustomEase";
import { Observer } from "gsap/Observer";

let registered = false;

export type EaseName = "sea" | "swell" | "ember";

/** Curvas espejo de `--ease-*` en tokens.css: misma sensación en JS y CSS. */
const EASES: Record<EaseName, string> = {
  sea: "0.16,0.84,0.24,1",
  swell: "0.62,0,0.12,1",
  ember: "0.3,0.7,0.2,1.02",
};

export function setupGsap(): typeof gsap {
  if (registered) return gsap;
  registered = true;
  gsap.registerPlugin(ScrollTrigger, SplitText, Flip, DrawSVGPlugin, MorphSVGPlugin, CustomEase, Observer);

  (Object.keys(EASES) as EaseName[]).forEach((name) => {
    if (!gsap.parseEase(name)) CustomEase.create(name, `M0,0 C${EASES[name]} 1,1`);
  });

  gsap.defaults({ ease: "sea", duration: 0.9 });
  return gsap;
}

export { gsap, ScrollTrigger, SplitText, Flip, DrawSVGPlugin, MorphSVGPlugin, CustomEase, Observer };

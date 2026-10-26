/**
 * GSAP con los plugins de coreografía, en un segundo módulo para que el scroll
 * base (Lenis + ScrollTrigger) no espere por SplitText/Flip/DrawSVG/Observer.
 * Registro único: ningún componente de sección registra de más.
 *
 * Convención del proyecto (documentada en CLAUDE.md):
 *  - GSAP  → scroll (ScrollTrigger), coreografías, SplitText, Flip, DrawSVG,
 *            Observer, easings.
 *  - Sin Motion: Radix + CSS resuelven mejor diálogos y tabs, y Motion en el
 *    bundle inicial costaba ~70 KB gzip.
 *
 * MORPHSVG a propósito AFUERA: estaba registrado pero no lo usaba ninguna
 * animación, y son ~20 KB minificados. Si aparece un morph real (la tortuga
 * deformándose), se agrega acá y se documenta en CLAUDE.md.
 */
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { Observer } from "gsap/Observer";
import { gsap, ScrollTrigger, CustomEase, setupGsapCore, type EaseName } from "./gsap-core";

let pluginsRegistered = false;

export function setupGsap(): typeof gsap {
  setupGsapCore();
  if (pluginsRegistered) return gsap;
  pluginsRegistered = true;
  gsap.registerPlugin(SplitText, Flip, DrawSVGPlugin, Observer);
  return gsap;
}

export {
  gsap,
  ScrollTrigger,
  CustomEase,
  SplitText,
  Flip,
  DrawSVGPlugin,
  Observer,
  setupGsapCore,
  type EaseName,
};

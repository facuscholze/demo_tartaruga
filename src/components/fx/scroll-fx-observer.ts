/**
 * Observador compartido de visibilidad: las secciones lo usan para pausar
 * sus loops (shader, audio, marquesinas) cuando no están en pantalla.
 */
const callbacks = new WeakMap<Element, (visible: boolean) => void>();
let observer: IntersectionObserver | null = null;

function ensure() {
  if (observer || typeof IntersectionObserver === "undefined") return;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        callbacks.get(entry.target)?.(entry.isIntersecting);
      }
    },
    { rootMargin: "80px", threshold: 0.01 },
  );
}

export function watchVisibility(element: Element, callback: (visible: boolean) => void) {
  ensure();
  if (!observer) {
    callback(true);
    return () => {};
  }
  callbacks.set(element, callback);
  observer.observe(element);
  return () => {
    callbacks.delete(element);
    observer?.unobserve(element);
  };
}

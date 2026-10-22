/** Grano de película. Un div con el filtro SVG en background: sin canvas. */
export function Grain() {
  return <div className="grain pointer-events-none absolute inset-0 z-[2]" aria-hidden="true" data-grain />;
}

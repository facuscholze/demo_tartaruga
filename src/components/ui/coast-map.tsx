import { mapsHref, type SiteSnapshot } from "@/features/site/links";
import { pickText } from "@/features/content/l10n";

/**
 * Mapa propio en SVG: costa, Acceso, faro y marcador. Cero APIs de terceros
 * (ni key ni tracker), escalable a retina y con tinta que sigue al cielo.
 * El enlace real a Google Maps está abajo, así la precisión topográfica la
 * mantiene Google y nosotros solo damos el contexto.
 */
export function CoastMap({ snapshot, locale, title, note, openLabel }: { snapshot: SiteSnapshot; locale: string; title: string; note: string; openLabel: string }) {
  return (
    <figure className="card relative overflow-clip p-0">
      <figcaption className="flex items-baseline justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
        <span className="label">{title}</span>
        <span className="label text-[0.53rem] text-[var(--fg-faint)]">{note}</span>
      </figcaption>
      <svg viewBox="0 0 400 260" className="block h-auto w-full" role="img" aria-label={title}>
        <defs>
          <linearGradient id="map-sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="color-mix(in oklab, var(--sky-mid) 70%, #071018)" />
            <stop offset="100%" stopColor="color-mix(in oklab, var(--sky-low) 60%, #050a12)" />
          </linearGradient>
          <pattern id="map-waves" width="26" height="14" patternUnits="userSpaceOnUse">
            <path d="M0 8c4-5 9-5 13 0s9 5 13 0" fill="none" stroke="var(--c-bone)" strokeOpacity="0.13" strokeWidth="1" />
          </pattern>
        </defs>

        <rect width="400" height="260" fill="url(#map-sea)" />
        <rect width="400" height="260" fill="url(#map-waves)" />

        {/* Tierra: la lengua de Punta Colorada metiéndose en el mar. */}
        <path
          d="M0 260V150c40-6 74-16 104-32 26-14 44-32 74-38 34-7 62 6 92 2 24-3 40-12 30-26 40 10 66 30 100 30v174Z"
          fill="color-mix(in oklab, var(--c-sand-wet) 34%, var(--c-haze))"
          stroke="var(--c-bone)"
          strokeOpacity="0.28"
          strokeWidth="1.2"
        />
        {/* Rambla / línea de costa */}
        <path
          d="M0 150c40-6 74-16 104-32 26-14 44-32 74-38 34-7 62 6 92 2 24-3 40-12 30-26"
          fill="none"
          stroke="var(--c-spark)"
          strokeOpacity="0.55"
          strokeWidth="1.6"
        />
        {/* Camino al faro */}
        <path d="M120 260c8-44 26-72 58-92 22-14 40-18 60-24" fill="none" stroke="var(--c-bone)" strokeOpacity="0.3" strokeWidth="2" strokeDasharray="6 7" />

        {/* Faro */}
        <g transform="translate(236 132)">
          <path d="M-5 14h10l-2-22h-6Z" fill="var(--c-bone)" fillOpacity="0.9" />
          <rect x="-6" y="-12" width="12" height="4" rx="1" fill="var(--c-sunset)" />
          <g stroke="var(--c-spark)" strokeWidth="1.1" opacity="0.75">
            <path d="M0-14-26-30M0-14 26-30M0-14-32-6M0-14 32-6" />
          </g>
          <circle r="2.6" fill="var(--c-spark)" className="map-beacon" />
          <text x="0" y="30" textAnchor="middle" fontSize="8" fill="var(--fg-muted)" style={{ fontFamily: "var(--font-type)", letterSpacing: "0.14em" }}>
            Faro
          </text>
        </g>

        {/* Marcador del local */}
        <g transform="translate(168 176)" className="map-pin">
          <circle cx="0" cy="0" r="16" fill="none" stroke="var(--c-sunset)" strokeOpacity="0.45" strokeWidth="1.2" className="map-pin__ring" />
          <path d="M0 14c7-9 11-13 11-19a11 11 0 1 0-22 0c0 6 4 10 11 19Z" fill="var(--c-sunset)" />
          <circle cx="0" cy="-5" r="4.4" fill="var(--c-abyss)" />
        </g>
        <text x="168" y="212" textAnchor="middle" fontSize="10" fill="var(--fg)" style={{ fontFamily: "var(--font-display)", letterSpacing: "0.02em" }}>
          {snapshot.name}
        </text>

        {/* Rosa de los vientos */}
        <g transform="translate(360 218)" opacity="0.55">
          <circle r="17" fill="none" stroke="var(--c-bone)" strokeOpacity="0.3" />
          <path d="M0-15 4 0H-4Z" fill="var(--c-spark)" />
          <path d="M0 15 4 0H-4Z" fill="var(--c-bone)" fillOpacity="0.4" />
          <text y="-21" textAnchor="middle" fontSize="7.5" fill="var(--fg-muted)" style={{ fontFamily: "var(--font-type)" }}>
            N
          </text>
        </g>
      </svg>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] px-4 py-3">
        <p className="text-[0.86rem] text-[var(--fg-muted)]">
          {pickText(snapshot.address.street, locale)}, {pickText(snapshot.address.locality, locale)}
        </p>
        <a href={mapsHref(snapshot)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost py-2 text-[0.78rem]">
          {openLabel}
          <span aria-hidden> ↗</span>
        </a>
      </div>
    </figure>
  );
}

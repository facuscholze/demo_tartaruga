import { cn } from "@/lib/utils";

/**
 * La tortuga del logo, en SVG propio (trazo orgánico, caparazón abierto).
 * Cada path lleva `pathLength={100}` para que DrawSVG recorra la línea
 * completa sin importar su longitud real. Es el mismo archivo que
 * `public/images/brand/logo-tortuga.svg` (mantener en sync si el local
 * entrega el vector final).
 */
export function TurtleMark({
  className,
  stroke = 4.6,
  animated = false,
  title = "Tartaruga",
}: {
  className?: string;
  stroke?: number;
  animated?: boolean;
  title?: string;
}) {
  const draw = { "data-draw": animated ? "turtle" : undefined } as Record<string, string | undefined>;
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      role="img"
      aria-label={title}
      className={cn("block h-auto w-full", className)}
      style={{ color: "currentColor" }}
      {...draw}
    >
      <g
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        pathLength={100}
      >
        <path
          d="M74.5 67.5C86 40 132 28.5 153 47.5c21 19 18 57-6 71.5-24 14.5-58.5 8-71-14"
          pathLength={100}
          strokeDasharray={animated ? "100 100" : undefined}
          strokeDashoffset={animated ? 100 : undefined}
        />
        <path
          d="M153 47.5c15.5-12.5 34.5-15.5 45.5-7 11 8.5 8.5 23.5-4 29.5-8 4-19.5 4.5-28 3"
          pathLength={100}
          strokeDasharray={animated ? "100 100" : undefined}
          strokeDashoffset={animated ? 100 : undefined}
        />
        <path d="M118.5 43.5C113.5 25 126 10 145.5 9.5" pathLength={100} />
        <path d="M90.5 119.5C82 138 66 149 49 146.5" pathLength={100} />
        <path d="M147 119c8 13.5 22.5 20 37 15.5" pathLength={100} />
        <path d="M74.5 104.5C60.5 107 49.5 101 43 90.5" pathLength={100} />
        <path d="M101 73.5 121 58.5l21.5 13" strokeWidth={stroke * 0.52} opacity={0.72} pathLength={100} />
        <path d="M96.5 92.5 121 105.5l23-14.5" strokeWidth={stroke * 0.52} opacity={0.72} pathLength={100} />
        <path d="M121 58.5v47" strokeWidth={stroke * 0.52} opacity={0.55} pathLength={100} />
      </g>
      <circle cx="186.5" cy="51.5" r={stroke * 0.58} fill="currentColor" />
    </svg>
  );
}

/** Horizonte con olas dibujadas a mano (para el hero, debajo del nombre). */
export function HorizonWaves({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 90"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn("block w-full", className)}
      fill="none"
    >
      {[0, 1, 2].map((index) => (
        <path
          key={index}
          d={`M0 ${26 + index * 18}c90 ${index % 2 ? -12 : 13} 180 ${index % 2 ? 14 : -11} 300 ${index % 2 ? 4 : -3}s240 ${index % 2 ? 16 : -14} 360 -2 240 ${index % 2 ? -13 : 12} 360 1 240 ${index % 2 ? 12 : -10} 420 ${index % 2 ? -3 : 4}`}
          stroke="currentColor"
          strokeOpacity={0.5 - index * 0.13}
          strokeWidth={1.25 + index * 0.35}
          strokeLinecap="round"
          data-wave={index}
        />
      ))}
    </svg>
  );
}

/** Faro: trazo vertical + haz de luz (DrawSVG en la entrada del hero). */
export function Lighthouse({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 260" fill="none" aria-hidden="true" className={cn("block", className)}>
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M42 250V120c0-6 3-9 8-11l2-45" />
        <path d="M78 250V120c0-6-3-9-8-11l-2-45" />
        <path d="M38 250h44" />
        <path d="M46 58h28l-4-16H50z" />
        <path d="M50 42h20l-3-14H53z" />
        <path d="M53 28h14l-7-12z" />
        <path d="M44 150h32M44 186h32M44 220h32" strokeOpacity=".45" strokeWidth="2" />
      </g>
      <g stroke="currentColor" strokeWidth="1.6" strokeOpacity=".55" strokeLinecap="round">
        <path d="M78 50l30-9M42 50 12 41M78 62l34 6M42 62 8 68" />
      </g>
      <circle cx="60" cy="46" r="4.5" fill="currentColor" />
    </svg>
  );
}

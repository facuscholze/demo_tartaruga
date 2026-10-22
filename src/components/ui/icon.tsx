import { cn } from "@/lib/utils";

/**
 * Íconos propios en estilo grabado (línea, sin relleno), dibujados en
 * `public/images/icons/*.svg`. Acá van las variantes inline que necesitan
 * `currentColor` y estados (sonido on/off, flechas).
 */
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export type IconName =
  | "sound-on"
  | "sound-off"
  | "spark"
  | "arrow-down"
  | "arrow-right"
  | "close"
  | "menu"
  | "whatsapp"
  | "phone"
  | "pin"
  | "clock"
  | "globe"
  | "sun"
  | "moon"
  | "paw";

export function Icon({ name, className, size = 20 }: { name: IconName; className?: string; size?: number }) {
  const common = { ...base, width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": true, class: cn(className) };
  switch (name) {
    case "sound-on":
      return (
        <svg {...common}>
          <path d="M4 9v6h3l4.5 3.5V5.5L7 9H4Z" />
          <path d="M15 9.2c1.4 1 1.4 4.6 0 5.6M17.8 6.8c2.6 2.2 2.6 8.2 0 10.4" />
        </svg>
      );
    case "sound-off":
      return (
        <svg {...common}>
          <path d="M4 9v6h3l4.5 3.5V5.5L7 9H4Z" />
          <path d="M15.5 10l5 4M20.5 10l-5 4" />
        </svg>
      );
    case "spark":
      return (
        <svg {...common}>
          <path d="M12 3c1.6 3.6 4.4 5 4.4 8.4A4.4 4.4 0 0 1 12 16a4.4 4.4 0 0 1-4.4-4.6C7.6 8 10.4 6.6 12 3Z" />
          <path d="M12 16v5" />
        </svg>
      );
    case "arrow-down":
      return (
        <svg {...common}>
          <path d="M12 4v15M6 13.5 12 19.5l6-6" />
        </svg>
      );
    case "arrow-right":
      return (
        <svg {...common}>
          <path d="M4 12h15M13 6l6 6-6 6" />
        </svg>
      );
    case "close":
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      );
    case "menu":
      return (
        <svg {...common}>
          <path d="M4 8h16M4 16h10" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...common}>
          <path d="M4.2 19.8 5.5 15A7.6 7.6 0 1 1 9 18.4l-4.8 1.4Z" />
          <path d="M9.2 8.6c.3 1.1 1 2.2 2 3.1s2 1.6 3.1 1.9c.6-.5.9-1.1 1-1.6l-2-.9-1 .8c-.7-.4-1.3-1-1.7-1.7l.8-1-.9-2c-.5.1-1.1.4-1.3 1.4Z" strokeWidth="1.2" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <path d="M5 4h3.4l1.4 3.6-2 1.6a11 11 0 0 0 5 5l1.6-2 3.6 1.4V17c0 1.1-.9 2-2 2A14.5 14.5 0 0 1 3 6c0-1.1.9-2 2-2Z" />
        </svg>
      );
    case "pin":
      return (
        <svg {...common}>
          <path d="M12 21c4.2-5 6-7.6 6-10.4A6 6 0 0 0 6 10.6C6 13.4 7.8 16 12 21Z" />
          <circle cx="12" cy="10.4" r="2.2" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.4" />
          <path d="M12 7.6V12l3 2" />
        </svg>
      );
    case "globe":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.4" />
          <path d="M3.8 9.6h16.4M3.8 14.4h16.4M12 3.6c2.4 2.4 2.4 14.4 0 16.8-2.4-2.4-2.4-14.4 0-16.8Z" />
        </svg>
      );
    case "sun":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6" />
        </svg>
      );
    case "moon":
      return (
        <svg {...common}>
          <path d="M19 14.6A7.6 7.6 0 0 1 9.4 5a7.6 7.6 0 1 0 9.6 9.6Z" />
        </svg>
      );
    case "paw":
      return (
        <svg {...common}>
          <ellipse cx="12" cy="16" rx="4.4" ry="3.4" />
          <ellipse cx="6.6" cy="11" rx="1.8" ry="2.3" />
          <ellipse cx="10.4" cy="8.2" rx="1.8" ry="2.3" />
          <ellipse cx="15" cy="8.4" rx="1.8" ry="2.3" />
          <ellipse cx="18" cy="11.6" rx="1.8" ry="2.3" />
        </svg>
      );
  }
}

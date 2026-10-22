import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "ghost";
  className?: string;
  external?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  dataCursor?: string;
};

/** CTA reservable: `Link` interno, `<a>` para tel:/wa.me, botón deshabilitado si no hay archivo. */
export function ButtonLink({ href, children, variant = "solid", className, external, disabled, ariaLabel, dataCursor }: Props) {
  const classes = cn("btn", variant === "ghost" && "btn-ghost", className);
  if (disabled) {
    return (
      <button type="button" disabled className={classes} aria-label={ariaLabel} data-disabled="true">
        {children}
      </button>
    );
  }
  const isExternal = external ?? /^https?:|^tel:|^mailto:/.test(href);
  if (isExternal) {
    return (
      <a
        href={href}
        className={classes}
        aria-label={ariaLabel}
        data-cursor={dataCursor}
        {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} aria-label={ariaLabel} data-cursor={dataCursor}>
      {children}
    </Link>
  );
}

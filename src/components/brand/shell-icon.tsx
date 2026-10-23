import { cn } from "@/lib/utils";

/**
 * Sellos grabados de `public/images/icons/` inyectados como máscara CSS: el
 * color lo define el contexto (papel o noche) sin duplicar trazos ni depender
 * de un set de íconos de terceros.
 */
export function ShellIcon({ src, className }: { src: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0 bg-current", className)}
      style={{
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
        maskSize: "contain",
        WebkitMaskSize: "contain",
      }}
    />
  );
}

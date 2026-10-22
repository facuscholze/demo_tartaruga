"use client";

import { cn } from "@/lib/utils";

/**
 * Grupo de botones accesible (radiogroup nativo: teclado, aria-checked,
 * flechas). Radix se usa donde hay diálogo/popover; para un toggle simple
 * esto es más liviano y sigue siendo AA.
 */
export type Option<T extends string> = { value: T; label: string; title?: string };

export function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
  className,
}: {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const index = Math.max(0, options.findIndex((option) => option.value === value));
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-[var(--line)] bg-[color-mix(in_oklab,var(--c-navy)_58%,transparent)] p-0.5 backdrop-blur-[6px]",
        className,
      )}
      onKeyDown={(event) => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        event.preventDefault();
        const next = event.key === "ArrowRight" ? (index + 1) % options.length : (index - 1 + options.length) % options.length;
        const option = options[next];
        if (option) {
          onChange(option.value);
          const el = event.currentTarget.querySelectorAll<HTMLButtonElement>("[role='radio']")[next];
          el?.focus();
        }
      }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={option.title ?? option.label}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full font-type uppercase tracking-[0.14em] transition-[background-color,color] duration-[var(--d-2)]",
              size === "sm" ? "px-2 py-1 text-[0.6rem]" : "px-2.5 py-1.5 text-[0.64rem]",
              active ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "text-[var(--fg-muted)] hover:text-[var(--fg)]",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

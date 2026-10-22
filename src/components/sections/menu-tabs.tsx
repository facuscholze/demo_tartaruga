"use client";

/**
 * Carta navegable. Tabs de Radix (teclado, ARIA y foco ya resueltos bien) con
 * la foto revelándose por máscara al pasar el mouse; en pantallas chicas la
 * foto se expande adentro de la fila, que es lo que funciona con el dedo.
 *
 * La distorsión de agua (`#tart-water`) se aplica solo durante la revelación y
 * solo en tier high: es un detalle de textura, no un filtro permanente sobre la
 * comida (leería sucio y costaría frames).
 */
import * as Tabs from "@radix-ui/react-tabs";
import { useCallback, useRef, useState } from "react";
import { Media } from "@/components/ui/media";
import { ShellIcon } from "@/components/brand/shell-icon";
import { useQualitySettings } from "@/features/quality/store";
import { useReducedMotion } from "@/features/quality/store";
import { cn } from "@/lib/utils";

export type MenuItemProps = {
  id: string;
  name: string;
  description: string;
  price: string;
  secondary?: string;
  tags: { key: string; label: string }[];
  featured: boolean;
  badge?: string;
  image?: string;
  width: number;
  height: number;
  blur?: string;
};

export type MenuCategoryProps = {
  id: string;
  name: string;
  note?: string;
  icon?: string;
  items: MenuItemProps[];
};

export function MenuTabs({
  categories,
  pdfHref,
  downloadLabel,
  downloadDisabledLabel,
  emptyLabel,
  featuredLabel,
  photoLabel,
  hidePhotoLabel,
}: {
  categories: MenuCategoryProps[];
  pdfHref?: string;
  downloadLabel: string;
  downloadDisabledLabel: string;
  emptyLabel: string;
  featuredLabel: string;
  photoLabel: string;
  hidePhotoLabel: string;
}) {
  const [active, setActive] = useState(categories[0]?.id ?? "");
  const [peek, setPeek] = useState<MenuItemProps | null>(null);
  const [distort, setDistort] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const settings = useQualitySettings();
  const reduced = useReducedMotion();
  const canDistort = settings.webgl && settings.quality === "high" && !reduced;

  const showPeek = useCallback(
    (item: MenuItemProps) => {
      setPeek(item);
      if (!canDistort) return;
      setDistort(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setDistort(false), 420);
    },
    [canDistort],
  );

  const current = categories.find((category) => category.id === active) ?? categories[0];

  if (!current) {
    return <p className="text-[var(--paper-muted)]">{emptyLabel}</p>;
  }

  return (
    <Tabs.Root value={active} onValueChange={setActive} className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Tabs.List
          aria-label="Categorías de la carta"
          className="scrollbar-none -mx-1 flex snap-x gap-1 overflow-x-auto px-1 pb-1"
        >
          {categories.map((category) => (
            <Tabs.Trigger
              key={category.id}
              value={category.id}
              className={cn(
                "label flex snap-start items-center gap-2 rounded-full border px-3.5 py-2 whitespace-nowrap transition-colors duration-[var(--d-2)]",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--c-rust)]",
                category.id === active
                  ? "border-[var(--c-rust)] bg-[var(--c-rust)] text-[var(--c-bone)]"
                  : "border-[color-mix(in_oklab,var(--paper-ink)_22%,transparent)] text-[var(--paper-muted)] hover:border-[var(--c-rust)]/60 hover:text-[var(--paper-ink)]",
              )}
            >
              {category.icon ? (
                <ShellIcon src={category.icon} className={cn("h-3.5 w-3.5", category.id === active && "opacity-90")} />
              ) : null}
              {category.name}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {pdfHref ? (
          <a
            href={pdfHref}
            target="_blank"
            rel="noopener noreferrer"
            className="label shrink-0 border-b border-[var(--c-rust)] pb-0.5 text-[var(--c-rust)] hover:bg-[color-mix(in_oklab,var(--c-rust)_10%,transparent)]"
          >
            {downloadLabel}
          </a>
        ) : (
          <span
            title={downloadDisabledLabel}
            aria-disabled="true"
            className="label shrink-0 cursor-not-allowed border-b border-dashed border-[color-mix(in_oklab,var(--paper-ink)_25%,transparent)] pb-0.5 text-[color-mix(in_oklab,var(--paper-ink)_45%,transparent)]"
          >
            {downloadLabel}
          </span>
        )}
      </div>

      {categories.map((category) => (
        <Tabs.Content
          key={category.id}
          value={category.id}
          className="grid gap-8 outline-none data-[state=active]:animate-[fade-up_var(--d-3)_var(--ease-sea)] lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-12"
        >
          <ul className="flex flex-col gap-1">
            {category.note ? <li className="label mb-3 text-[var(--paper-muted)]">{category.note}</li> : null}
            {category.items.map((item) => (
              <li
                key={item.id}
                data-dish={item.id}
                onMouseEnter={() => showPeek(item)}
                onFocus={() => showPeek(item)}
                className={cn(
                  "group relative border-b border-dashed border-[color-mix(in_oklab,var(--paper-ink)_16%,transparent)] py-3.5 transition-[background-color,transform] duration-[var(--d-2)]",
                  item.featured && "bg-[color-mix(in_oklab,var(--c-ember)_9%,transparent)] px-3 -mx-3 rounded-sm",
                )}
              >
                <div className="flex items-baseline gap-2">
                  <h3 className="font-display text-[1.28rem] leading-snug font-medium text-[var(--paper-ink)]">
                    {item.name}
                    {item.badge ? (
                      <span className="label ml-2 align-middle text-[0.55rem] text-[var(--c-rust)]">{item.badge}</span>
                    ) : null}
                    {item.featured ? (
                      <span className="label ml-2 align-middle text-[0.55rem] text-[var(--c-ember)]">
                        ★ {featuredLabel}
                      </span>
                    ) : null}
                  </h3>
                  <span
                    aria-hidden
                    className="leader mx-1 flex-1 self-end translate-y-[-0.28em] text-[color-mix(in_oklab,var(--paper-ink)_38%,transparent)]"
                  />
                  <span className="price shrink-0 text-[1.02rem] text-[var(--paper-ink)]">{item.price}</span>
                </div>
                {item.description ? (
                  <p className="mt-1 max-w-[62ch] text-[0.93rem] leading-relaxed text-[var(--paper-muted)]">
                    {item.description}
                  </p>
                ) : null}
                {item.secondary ? (
                  <p className="label mt-1 text-[0.58rem] text-[var(--c-rust)]">{item.secondary}</p>
                ) : null}
                {item.tags.length > 0 ? (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <li
                        key={tag.key}
                        className="label rounded-full border border-[color-mix(in_oklab,var(--paper-ink)_18%,transparent)] px-2 py-1 text-[0.53rem] tracking-[0.16em] text-[var(--paper-muted)]"
                      >
                        {tag.label}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {/* Móvil: la foto vive adentro de la fila. */}
                <button
                  type="button"
                  aria-expanded={openId === item.id}
                  aria-controls={`foto-${item.id}`}
                  onClick={() => setOpenId(openId === item.id ? null : item.id)}
                  className="label mt-2 text-[0.56rem] text-[var(--c-rust)] underline underline-offset-4 lg:hidden"
                >
                  {openId === item.id ? hidePhotoLabel : photoLabel}
                </button>
                <div
                  id={`foto-${item.id}`}
                  hidden={openId !== item.id}
                  className="mt-3 aspect-[4/3] overflow-clip rounded-[3px] lg:hidden"
                >
                  <Media
                    src={item.image}
                    alt={item.name}
                    width={item.width}
                    height={item.height}
                    blurDataURL={item.blur}
                    className="rounded-[3px]"
                  />
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop: un solo panel de preview, no 17 imágenes montadas. */}
          <aside className="relative hidden lg:block">
            <div className="sticky top-24">
              <div
                data-dish-peek
                data-distort={distort ? "true" : "false"}
                className={cn(
                  "relative aspect-[4/5] overflow-clip rounded-[4px] bg-[color-mix(in_oklab,var(--c-sand-wet)_45%,transparent)]",
                  "transition-[clip-path,opacity] duration-[var(--d-3)] ease-[var(--ease-sea)]",
                )}
                style={{ clipPath: peek ? "inset(0 0 0 0)" : "inset(0 0 100% 0)" }}
              >
                {peek ? (
                  <Media
                    key={peek.id}
                    src={peek.image}
                    alt={peek.name}
                    width={peek.width}
                    height={peek.height}
                    blurDataURL={peek.blur}
                    sizes="34vw"
                    className={cn(distort && "heat-haze")}
                  />
                ) : null}
                <span className="label absolute bottom-3 left-3 rounded-full bg-[var(--c-abyss)]/70 px-2.5 py-1 text-[0.55rem] text-[var(--c-bone)] backdrop-blur-sm">
                  {peek?.name ?? ""}
                </span>
              </div>
            </div>
          </aside>
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}

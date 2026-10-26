import { getLocale, getTranslations } from "next-intl/server";
import { getSiteContent } from "@/features/content/load";
import { pickText } from "@/features/content/l10n";
import { formatPrice, formatSecondaryPrice } from "@/features/content/format";
import { tagLabels } from "@/features/content/schema";
import { MenuTabs, type MenuCategoryProps } from "@/components/sections/menu-tabs";
import { ShellIcon } from "@/components/brand/shell-icon";
import { withBase } from "@/lib/base";

/**
 * Carta. El servidor resuelve textos, precios e imágenes; el cliente solo
 * organiza (tabs accesibles, reveal de foto, tap en móvil).
 */
export async function MenuSection() {
  const locale = await getLocale();
  const t = await getTranslations("menu");
  const content = await getSiteContent();
  const currency = content.site.currency;

  const categories: MenuCategoryProps[] = content.menu.categories
    .filter((category) => category.items.length > 0)
    .map((category) => ({
      id: category.id,
      name: pickText(category.name, locale),
      note: category.note ? pickText(category.note, locale) : undefined,
      icon: category.iconSrc,
      items: category.items.map((item) => ({
        id: item.id,
        name: pickText(item.name, locale),
        description: item.description ? pickText(item.description, locale) : "",
        price: formatPrice(item.price, currency, locale),
        secondary: formatSecondaryPrice(item.price, currency),
        tags: (item.tags ?? []).map((tag) => ({
          key: tag,
          label: tagLabels[tag]?.[locale.startsWith("en") ? "en" : "es"] ?? tag.replace(/-/g, " "),
        })),
        featured: Boolean(item.featured),
        badge: item.badge ? pickText(item.badge, locale) : undefined,
        image: item.image.src,
        width: item.image.width,
        height: item.image.height,
        blur: item.image.blurDataURL,
      })),
    }));

  return (
    <section
      id="carta"
      data-surface="sand"
      aria-labelledby="carta-title"
      className="paper relative isolate overflow-clip py-20 text-[var(--paper-ink)] md:py-28"
    >
      <div className="shell relative z-[3] flex flex-col gap-10">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="label flex items-center gap-2 text-[var(--c-rust)]">
              <ShellIcon src={withBase("/images/icons/caracola-1.svg")} className="h-4 w-4" />
              {t("title")}
            </p>
            <h2
              id="carta-title"
              className="mt-3 text-[var(--text-display)] text-[var(--paper-ink)]"
            >
              {t("title")}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {content.menu.demo ? (
              <span className="label rounded-full border border-dashed border-[var(--c-rust)]/60 px-3 py-1.5 text-[0.58rem] text-[var(--c-rust)]">
                {t("demoBadge")}
              </span>
            ) : null}
          </div>
        </header>

        {content.menu.note ? (
          <p className="max-w-[62ch] border-l-2 border-[var(--c-rust)]/40 pl-4 text-[0.95rem] text-[var(--paper-muted)]">
            {pickText(content.menu.note, locale)}
          </p>
        ) : null}

        <MenuTabs
          categories={categories}
          pdfHref={content.site.links.menuPdf || undefined}
          downloadLabel={t("download")}
          downloadDisabledLabel={t("downloadDisabled")}
          emptyLabel={t("empty")}
          featuredLabel={t("featuredLabel")}
          photoLabel={t("photo")}
          hidePhotoLabel={t("hidePhoto")}
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 opacity-[0.07]"
      >
        <ShellIcon src={withBase("/images/icons/almeja-1.svg")} className="h-full w-full" />
      </div>
    </section>
  );
}

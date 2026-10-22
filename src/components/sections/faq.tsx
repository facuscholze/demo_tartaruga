import { getLocale, getTranslations } from "next-intl/server";
import * as Accordion from "@radix-ui/react-accordion";
import { getSiteContent } from "@/features/content/load";
import { pickText } from "@/features/content/l10n";

/**
 * Preguntas frecuentes. Cada respuesta que el local todavía no confirmó sale con
 * su sello, así el texto útil y el pendiente se leen distinto sin esconder nada.
 * Acordeón de Radix: teclado, `aria-expanded` y un solo panel abierto a la vez.
 */
export async function FaqSection() {
  const locale = await getLocale();
  const t = await getTranslations("faq");
  const content = await getSiteContent();
  const items = content.faq;
  if (items.length === 0) return null;

  return (
    <section id="preguntas" aria-labelledby="faq-title" className="relative isolate py-18 md:py-24">
      <div className="shell grid gap-10 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <header>
          <p className="label text-[var(--c-ember)]">{t("title")}</p>
          <h2
            id="faq-title"
            data-reveal="words"
            className="mt-3 max-w-[14ch] text-[var(--text-h2)] text-[var(--fg)]"
          >
            {t("title")}
          </h2>
          <p className="mt-4 max-w-[34ch] text-[0.95rem] leading-relaxed text-[var(--fg-muted)]">
            {t("note")}
          </p>
        </header>

        <Accordion.Root type="single" collapsible className="border-t border-[var(--line)]">
          {items.map((item) => (
            <Accordion.Item key={item.id} value={item.id} className="border-b border-[var(--line)]">
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-start gap-4 py-5 text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--c-spark)]">
                  <span className="flex-1 font-display text-[1.18rem] leading-snug text-[var(--fg)] transition-colors duration-[var(--d-2)] group-hover:text-[var(--c-spark)]">
                    {pickText(item.question, locale)}
                  </span>
                  {item.confirmed ? null : (
                    <span className="label mt-1 shrink-0 rounded-full border border-dashed border-[var(--c-ember)]/60 px-2 py-0.5 text-[0.5rem] text-[var(--c-ember)]">
                      {t("pending")}
                    </span>
                  )}
                  <span
                    aria-hidden
                    className="mt-1 shrink-0 text-[var(--fg-muted)] transition-transform duration-[var(--d-3)] ease-[var(--ease-sea)] group-data-[state=open]:rotate-45"
                  >
                    +
                  </span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden data-[state=closed]:animate-[accordion-up_260ms_var(--ease-sea)] data-[state=open]:animate-[accordion-down_300ms_var(--ease-sea)]">
                <p className="max-w-[68ch] pb-6 pr-8 text-[0.98rem] leading-relaxed text-[var(--fg-muted)]">
                  {pickText(item.answer, locale)}
                </p>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  );
}

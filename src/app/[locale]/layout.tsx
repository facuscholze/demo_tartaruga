import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getSiteContent } from "@/features/content/load";
import { JsonLd } from "@/components/seo/json-ld";
import { buildSnapshot, quickReserveMessage, telHref, whatsappHref } from "@/features/site/links";
import { SiteProvider } from "@/features/site/context";
import { fontVariables } from "@/lib/fonts";
import { QualityProvider } from "@/features/quality/provider";
import { SkyRoot } from "@/features/sky/sky-root";
import { LenisProvider } from "@/hooks/use-lenis";
import { Header } from "@/components/shell/header";
import { Footer } from "@/components/shell/footer";
import { Intro } from "@/components/sections/intro";
import { ScrollFx } from "@/components/fx/scroll-fx";
import { AudioVisualLink } from "@/components/fx/audio-visual-link";
import { WaveTransition } from "@/components/fx/wave-transition";
import { CustomCursor } from "@/components/fx/cursor";
import { SvgDefs } from "@/components/fx/svg-defs";
import { MobileReserveBar } from "@/components/shell/mobile-reserve-bar";
import { SoundGlobalToggle } from "@/components/shell/sound-global-toggle";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const dynamicParams = true;

type Params = { locale: string };

/** Base absoluta para OG/canonical/sitemap. Sin env, usa el dominio de deploy. */
function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.tartaruga.arena.site").replace(
    /\/$/,
    "",
  );
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale } = await params;
  const base = siteUrl();
  const path = locale === routing.defaultLocale ? "" : `/${locale}`;
  const content = await getSiteContent();
  const site = content.site;
  const t = await getTranslations({ locale, namespace: "meta" });
  const title = site.seo.defaultTitle as Record<string, string | undefined>;
  const description =
    (title.es && (site.seo.description as Record<string, string | undefined>)) || undefined;

  const languages: Record<string, string> = {
    "es-UY": "/",
    en: "/en",
    "pt-BR": "/pt",
    "x-default": "/",
  };

  return {
    metadataBase: new URL(base),
    title: {
      default: title[locale] ?? title.es ?? site.name,
      template: site.seo.titleTemplate,
    },
    description:
      description?.[locale] ??
      (site.seo.description as Record<string, string>).es ??
      t("description"),
    alternates: {
      canonical: path || "/",
      languages,
    },
    openGraph: {
      type: "website",
      locale: locale === "es" ? "es_UY" : locale === "en" ? "en_US" : "pt_BR",
      url: `${base}${path || "/"}`,
      siteName: site.name,
      title: title[locale] ?? title.es ?? site.name,
      description:
        (site.seo.description as Record<string, string>)[locale] ??
        (site.seo.description as Record<string, string>).es,
      images: [
        {
          url: `${base}/og/${locale}`,
          width: 1200,
          height: 630,
          alt: `${site.name} — ${site.address.locality.es}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: title[locale] ?? title.es ?? site.name,
      description: (site.seo.description as Record<string, string>).es,
      images: [`${base}/og/${locale}`],
    },
    other: { "hl:locale": "es-UY" },
  };
}

export const viewport: Viewport = {
  themeColor: "#0E1526",
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<Params>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const content = await getSiteContent();
  const snapshot = buildSnapshot(content.site);
  const reserveHref = whatsappHref(snapshot, quickReserveMessage(snapshot.name, locale));

  return (
    <html lang={locale} data-locale={locale} suppressHydrationWarning>
      <head>
        {/* Marca temprana: sin esto, los elementos con reveal aparecen y luego
            se ocultan (flash). Es inline a propósito: corre antes del primer paint. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.dataset.js="1";if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.dataset.reducedMotion="true"}`,
          }}
        />
      </head>
      <body
        className={`${fontVariables} bg-[var(--bg)] text-[var(--fg)] antialiased`}
        style={{ viewTransitionName: "root" }}
      >
        <a href="#contenido" className="skip-link">
          Saltar al contenido
        </a>
        <NextIntlClientProvider>
          <SiteProvider snapshot={snapshot}>
            <QualityProvider>
              <SkyRoot coords={snapshot.coords} timeZone={snapshot.timezone}>
                <LenisProvider>
                  <Intro />
                  <SvgDefs />
                  <CustomCursor />
                  <ScrollFx />
                  <AudioVisualLink />
                  <WaveTransition />
                  <Header reserveHref={reserveHref} />
                  <main id="contenido" className="relative">
                    {children}
                  </main>
                  <Footer
                    snapshot={snapshot}
                    links={{ whatsapp: reserveHref, tel: telHref(snapshot) }}
                  />
                  <MobileReserveBar reserveHref={reserveHref} />
                  <SoundGlobalToggle />
                  <JsonLd siteUrl={siteUrl()} />
                </LenisProvider>
              </SkyRoot>
            </QualityProvider>
          </SiteProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

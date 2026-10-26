import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getSiteContent } from "@/features/content/load";
import { JsonLd } from "@/components/seo/json-ld";
import { buildSnapshot, quickReserveMessage, telHref, whatsappHref } from "@/features/site/links";
import { absoluteUrl } from "@/lib/base";
import { cspMeta } from "@/lib/csp";
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

/**
 * `false` porque el destino es `output: "export"`: cada locale se prerendera con
 * `generateStaticParams` y cualquier otra ruta la resuelve Pages con `404.html`.
 */
export const dynamicParams = false;

type Params = { locale: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale } = await params;
  const content = await getSiteContent();
  const site = content.site;
  const title = site.seo.defaultTitle as Record<string, string | undefined>;

  /**
   * OJO: no usamos `metadataBase`. En Next 16 con `output: "export"` la
   * resolución de URLs *relativas* de metadata lee el pathname de la request y
   * en el prerender estático no hay request: la build revienta con
   * `Cannot read properties of null (reading 'pathname')`. Armar cada URL
   * absoluta a mano (origen + base + ruta) evita el bug y es lo mismo que haría
   * `metadataBase`, con la ventaja de que funciona igual en project pages que en
   * dominio propio.
   */

  const description =
    (site.seo.description as Record<string, string | undefined>)[locale] ?? site.seo.description.es;

  return {
    title: {
      default: title[locale] ?? title.es ?? site.name,
      template: site.seo.titleTemplate,
    },
    description,
    alternates: {
      canonical: absoluteUrl(`/${locale}/`),
      languages: {
        "es-UY": absoluteUrl("/es/"),
        en: absoluteUrl("/en/"),
        "pt-BR": absoluteUrl("/pt/"),
        // La raíz: la página mínima que reparte idioma según `navigator.language`.
        "x-default": absoluteUrl("/"),
      },
    },
    openGraph: {
      type: "website",
      locale: locale === "es" ? "es_UY" : locale === "en" ? "en_US" : "pt_BR",
      url: absoluteUrl(`/${locale}/`),
      siteName: site.name,
      title: title[locale] ?? title.es ?? site.name,
      description,
      // Imagen estática generada en build (`pnpm og:build`), no un route handler:
      // en Pages no hay runtime. Cada idioma tiene la suya.
      images: [
        {
          url: absoluteUrl(`/og/${locale}.png`),
          width: 1200,
          height: 630,
          alt: `${site.name} — ${site.address.locality.es}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: title[locale] ?? title.es ?? site.name,
      description,
      images: [absoluteUrl(`/og/${locale}.png`)],
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
        {/*
          GitHub Pages no permite cabeceras de respuesta: la CSP tiene que vivir
          en el HTML. `frame-ancestors` se ignora en `<meta>` (limitación
          documentada en docs/deploy.md).
        */}
        <meta http-equiv="Content-Security-Policy" content={cspMeta()} />
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
                  <JsonLd siteUrl={absoluteUrl("/")} />
                </LenisProvider>
              </SkyRoot>
            </QualityProvider>
          </SiteProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

import { getSiteContent } from "@/features/content/load";
import { buildSnapshot } from "@/features/site/links";

/**
 * Datos estructurados. Regla del proyecto: SOLO lo que el local confirmó.
 * `servesCuisine` y `priceRange` se omiten si están vacíos en `site.json`
 * (inventarlos sería publicar un dato falso que además indexa Google).
 */
export async function JsonLd({ siteUrl }: { siteUrl: string }) {
  const content = await getSiteContent();
  const snapshot = buildSnapshot(content.site);
  const site = content.site;

  const address = {
    "@type": "PostalAddress",
    streetAddress: site.address.street.es,
    addressLocality: site.address.locality.es,
    addressRegion: site.address.region.es,
    postalCode: site.address.postalCode,
    addressCountry: site.address.countryCode,
  };
  const geo = { "@type": "GeoCoordinates", latitude: site.coords.lat, longitude: site.coords.lng };

  const restaurant: Record<string, unknown> = {
    "@type": ["Restaurant", "BarOrPub"],
    name: site.name,
    description: site.seo.description.es,
    url: siteUrl,
    telephone: snapshot.phoneE164,
    address,
    geo,
    hasMap: snapshot.maps,
    image: `${siteUrl}/images/brand/logo-tortuga.svg`,
    sameAs: site.links.instagram ? [site.links.instagram] : undefined,
    knowsLanguage: site.i18n.locales,
    isAccessibleForFree: true,
    acceptsReservations: {
      "@type": "Reservation",
      url: `${siteUrl}/#reservar`,
      provider: { "@type": "Organization", name: site.name },
    },
  };
  if (site.seo.servesCuisine) restaurant.servesCuisine = site.seo.servesCuisine;
  if (site.seo.priceRange) restaurant.priceRange = site.seo.priceRange;

  const openBlocks = site.hours.filter(
    (block) => block.confirmed && block.open && block.close && block.days.length > 0,
  );
  if (openBlocks.length > 0) {
    restaurant.openingHoursSpecification = openBlocks.map((block) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: block.days.map((day) => WEEKDAY_US[day] ?? day),
      opens: block.open,
      closes: block.close,
    }));
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": `${siteUrl}/#business`,
        name: site.name,
        url: siteUrl,
        image: `${siteUrl}/images/brand/logo-tortuga.svg`,
        telephone: snapshot.phoneE164,
        address,
        geo,
      },
      {
        "@id": `${siteUrl}/#website`,
        "@type": "WebSite",
        url: siteUrl,
        name: site.name,
        inLanguage: `${site.i18n.defaultLocale}-UY`,
      },
      { ...restaurant, "@id": `${siteUrl}/#restaurant` },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

const WEEKDAY_US: Record<string, string> = {
  lun: "Monday",
  mar: "Tuesday",
  mie: "Wednesday",
  jue: "Thursday",
  vie: "Friday",
  sab: "Saturday",
  dom: "Sunday",
};

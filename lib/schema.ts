import type { SiteContent } from "@/content/site";

/** Schema.org Bakery — only fields that are actually filled in content/site.ts are emitted. */
export function localBusinessJsonLd(site: SiteContent) {
  const sameAs = [site.social.instagram, site.social.facebook].filter(Boolean);
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Bakery",
    "@id": site.url + "/#bakery",
    name: site.name,
    url: site.url,
    logo: site.url + "/images/logo.png",
    image: site.url + site.seo.ogImage,
    description: site.seo.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      postalCode: site.address.postalCode,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      addressCountry: site.address.country,
    },
    areaServed: site.address.city,
    hasMap: site.links.maps,
  };
  if (site.phone) data.telephone = site.phone.tel;
  if (site.geo) data.geo = { "@type": "GeoCoordinates", latitude: site.geo.lat, longitude: site.geo.lng };
  if (site.hours) {
    data.openingHoursSpecification = site.hours.schema.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.days.map((d) => "https://schema.org/" + d),
      opens: h.opens,
      closes: h.closes,
    }));
  }
  if (sameAs.length) data.sameAs = sameAs;
  return data;
}

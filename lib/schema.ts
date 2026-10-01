/** Schema.org (JSON-LD) — seuls les champs réellement renseignés sont émis. */
import { site } from "@/content/site";
import type { ProductView } from "@/lib/catalog";

const abs = (p: string) => (p.startsWith("http") ? p : site.url + p);
const BAKERY_ID = site.url + "/#bakery";
const ORG_ID = site.url + "/#organization";

const address = () => ({
  "@type": "PostalAddress",
  streetAddress: site.address.street,
  postalCode: site.address.postalCode,
  addressLocality: site.address.city,
  addressRegion: site.address.region,
  addressCountry: site.address.country,
});

export function organizationJsonLd() {
  const sameAs = [site.social.instagram, site.social.facebook].filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: site.name,
    url: site.url,
    logo: abs("/images/logo.png"),
    ...(site.phone ? { telephone: site.phone.tel } : {}),
    address: address(),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

/** Bakery (sous-type de LocalBusiness / FoodEstablishment). */
export function localBusinessJsonLd(opts: { reviews?: { text: string; author: string; rating?: number }[] } = {}) {
  const sameAs = [site.social.instagram, site.social.facebook].filter(Boolean);
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Bakery",
    "@id": BAKERY_ID,
    name: site.name,
    url: site.url,
    logo: abs("/images/logo.png"),
    image: [abs(site.seo.ogImage), abs("/images/boutique.png")],
    description: site.seo.description,
    address: address(),
    parentOrganization: { "@id": ORG_ID },
    areaServed: site.local.towns.map((t) => ({ "@type": "City", name: t.name })),
    hasMap: site.links.maps,
    priceRange: "€",
    servesCuisine: "Boulangerie, pâtisserie française",
    acceptsReservations: false,
    potentialAction: {
      "@type": "OrderAction",
      target: { "@type": "EntryPoint", urlTemplate: site.url + "/commander", actionPlatform: ["https://schema.org/DesktopWebPlatform", "https://schema.org/MobileWebPlatform"] },
      deliveryMethod: "http://purl.org/goodrelations/v1#DeliveryModePickUp",
    },
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
  // Avis publiés tels quels (jamais de note agrégée inventée).
  if (opts.reviews?.length) {
    data.review = opts.reviews.slice(0, 10).map((r) => ({
      "@type": "Review",
      reviewBody: r.text,
      author: { "@type": "Person", name: r.author },
      ...(r.rating ? { reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 } } : {}),
    }));
  }
  return data;
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

function offer(p: ProductView, price: number, name?: string) {
  return {
    "@type": "Offer",
    ...(name ? { name } : {}),
    price: (price / 100).toFixed(2),
    priceCurrency: "EUR",
    availability: p.orderable ? "https://schema.org/InStock" : p.unavailable === "Épuisé" || p.unavailable === "Complet" ? "https://schema.org/SoldOut" : "https://schema.org/OutOfStock",
    url: site.url + "/produit/" + p.slug,
    seller: { "@id": BAKERY_ID },
    availableDeliveryMethod: "http://purl.org/goodrelations/v1#DeliveryModePickUp",
  };
}

export function productJsonLd(p: ProductView) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description ?? p.shortDescription ?? undefined,
    ...(p.image ? { image: abs(p.image) } : {}),
    ...(p.category ? { category: p.category.name } : {}),
    brand: { "@type": "Brand", name: site.name },
    offers: p.variants.length
      ? p.variants.length > 1
        ? {
            "@type": "AggregateOffer",
            priceCurrency: "EUR",
            lowPrice: (Math.min(...p.variants.map((v) => v.priceCents)) / 100).toFixed(2),
            highPrice: (Math.max(...p.variants.map((v) => v.priceCents)) / 100).toFixed(2),
            offerCount: p.variants.length,
            offers: p.variants.map((v) => offer(p, v.priceCents, v.label)),
          }
        : offer(p, p.variants[0].priceCents, p.variants[0].label)
      : offer(p, p.priceCents),
  };
}

export function itemListJsonLd(name: string, products: ProductView[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: products.filter((p) => !p.demo).map((p, i) => ({ "@type": "ListItem", position: i + 1, url: site.url + "/produit/" + p.slug, name: p.name })),
  };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

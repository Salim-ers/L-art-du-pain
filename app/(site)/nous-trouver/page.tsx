import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { Directions } from "@/components/Directions";
import { mapSrc } from "@/components/Location";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { ContactForm } from "@/components/shop/Forms";
import { site } from "@/content/site";
import { localBusinessJsonLd } from "@/lib/schema";
import { getReviews } from "@/lib/site-data";

// Servie par le CDN, régénérée en arrière-plan (au plus 60 s) et dès qu’une modification est faite dans la gestion.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Contact et accès — L’Art du Pain, boulangerie à Nogent-sur-Oise",
  description:
    "L’Art du Pain, 28 Avenue Saint-Exupéry, 60180 Nogent-sur-Oise. Boulangerie pâtisserie ouverte tous les jours, à quelques minutes de Creil, Montataire et Villers-Saint-Paul. Itinéraire, Waze, téléphone.",
  alternates: { canonical: "/nous-trouver" },
};

export default async function NousTrouverPage() {
  const reviews = await getReviews();
  const { address, phone, hours, links } = site;
  return (
    <main id="contenu">
      <JsonLd data={localBusinessJsonLd({ reviews: reviews.own ? reviews.items : [] })} />
      <PageHero
        compact
        crumbs={[{ name: "Contact", path: "/nous-trouver" }]}
        title={[<span key="t">Contact <span className="it accent">& accès.</span></span>]}
        intro={<p>La boutique se trouve à Nogent-sur-Oise, à quelques minutes de Creil, Montataire et Villers-Saint-Paul.</p>}
      />

      {/* Formulaire et accès côte à côte (empilés sur mobile : d'abord « Nous écrire »). */}
      <section className="section cpage">
        <div className="wrap cpage-grid">
          <Reveal className="cpage-form" id="contact">
            <p className="label">Contact</p>
            <h2 className="h-md">Nous écrire</h2>
            <p className="body body--sm">Une question sur un produit, une allergie, une commande pour une entreprise ? Nous vous répondons rapidement.</p>
            <ContactForm />
          </Reveal>

          <Reveal as="aside" className="cpage-info" delay={0.08} aria-label="Venez nous voir">
            <p className="label label--light">La boutique</p>
            <h2 className="h-md">Venez nous voir.</h2>
            <address className="cpage-address">
              <strong>{site.name}</strong>
              <span>{address.street}</span>
              <span>{address.postalCode} {address.city}</span>
            </address>
            {phone && (
              <a className="cpage-phone" href={"tel:" + phone.tel}>
                {phone.display}
              </a>
            )}
            {hours && (
              <p className="cpage-hours">
                <span>Horaires</span>
                {hours.display}
              </p>
            )}
            <div className="cpage-actions">
              <Directions tone="light" withOrder={false} reviewUrl={reviews.url} />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="cpage-map" aria-label={"Carte — " + site.name}>
        <iframe title={"Carte — " + site.name + ", " + address.city} src={mapSrc()} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        <a className="map-pin" href={links.maps} target="_blank" rel="noopener noreferrer">
          {site.name} — {address.city} ↗
        </a>
      </section>
    </main>
  );
}

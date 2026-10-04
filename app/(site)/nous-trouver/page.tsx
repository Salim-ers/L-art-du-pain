import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { Location } from "@/components/Location";
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
  return (
    <main id="contenu">
      <JsonLd data={localBusinessJsonLd({ reviews: reviews.own ? reviews.items : [] })} />
      <PageHero
        compact
        crumbs={[{ name: "Contact", path: "/nous-trouver" }]}
        label={`${site.address.street} — ${site.address.postalCode} ${site.address.city}`}
        title={["Contact", <span key="i" className="it accent">& accès.</span>]}
        intro={<p>La boutique se trouve à Nogent-sur-Oise, à quelques minutes de Creil, Montataire et Villers-Saint-Paul. {site.hours ? site.hours.display + "." : ""} Une question, une allergie, une commande pour une entreprise ? <a className="ulink" href="#contact"><span>Écrivez-nous</span></a>.</p>}
      />
      <Location />
      <section id="contact" className="section contact">
        <div className="wrap contact-grid">
          <div className="stack">
            <Reveal as="p" className="label">Contact</Reveal>
            <Reveal as="h2" className="h-lg">Nous écrire</Reveal>
            <Reveal as="p" className="body body--sm">
              Une question sur un produit, une commande pour une entreprise, une allergie ? Écrivez-nous
              {site.phone ? <>, ou appelez le <a className="ulink" href={"tel:" + site.phone.tel}><span>{site.phone.display}</span></a></> : null}.
            </Reveal>
          </div>
          <ContactForm />
        </div>
      </section>
    </main>
  );
}

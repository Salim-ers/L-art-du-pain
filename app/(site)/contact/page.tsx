import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { ContactForm } from "@/components/shop/Forms";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact — L’Art du Pain, Nogent-sur-Oise",
  description: "Une question, une commande pour une entreprise, une allergie ? Écrivez à L’Art du Pain, boulangerie pâtisserie à Nogent-sur-Oise.",
  alternates: { canonical: "/contact" },
};

/** Formulaire de contact : chaque message arrive dans Gestion → Messages (et par email à l'équipe si configuré). */
export default function ContactPage() {
  return (
    <main id="contenu">
      <PageHero
        compact
        crumbs={[{ name: "Contact", path: "/contact" }]}
        label={`${site.address.street} — ${site.address.postalCode} ${site.address.city}`}
        title={["Nous écrire"]}
        intro={
          <p>
            Une question sur un produit, une allergie, une commande pour une entreprise ? Écrivez-nous, nous vous répondons rapidement.
            {site.phone ? <> Vous pouvez aussi appeler le <a className="ulink" href={"tel:" + site.phone.tel}><span>{site.phone.display}</span></a>.</> : null}
          </p>
        }
      />
      <section className="section contact-page">
        <div className="wrap contact-page-grid">
          <ContactForm />
          <aside className="contact-aside">
            <p className="label">Pour aller plus vite</p>
            <Link href="/gateaux-sur-mesure" className="ulink"><span>Commander un gâteau</span><span className="arrow" aria-hidden="true">→</span></Link>
            <Link href="/commandes-speciales" className="ulink"><span>Commande pour un événement</span><span className="arrow" aria-hidden="true">→</span></Link>
            <Link href="/compte" className="ulink"><span>Suivre ma commande</span><span className="arrow" aria-hidden="true">→</span></Link>
            <Link href="/nous-trouver" className="ulink"><span>Adresse et horaires</span><span className="arrow" aria-hidden="true">→</span></Link>
          </aside>
        </div>
      </section>
    </main>
  );
}

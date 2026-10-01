import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { SpecialRequestForm } from "@/components/shop/SpecialRequestForm";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Commande pour entreprise, buffet ou grande quantité à Nogent-sur-Oise",
  description:
    "Petit-déjeuner d’entreprise, plateaux de viennoiseries, buffet, desserts pour un événement : faites votre demande à L’Art du Pain, boulangerie pâtisserie à Nogent-sur-Oise.",
  alternates: { canonical: "/commandes-speciales" },
};

export default function SpecialOrdersPage() {
  return (
    <main id="contenu">
      <PageHero
        compact
        crumbs={[{ name: "Commandes particulières", path: "/commandes-speciales" }]}
        label="Entreprises, associations, événements"
        title={["Une commande", <span key="i" className="it accent">particulière ?</span>]}
        intro={
          <p>
            Petit-déjeuner de réunion, plateaux de viennoiseries, pain pour un buffet, desserts pour une fête : dites-nous ce qu’il vous faut,
            nous revenons vers vous.{site.phone ? <> Vous pouvez aussi appeler le <a className="ulink" href={"tel:" + site.phone.tel}><span>{site.phone.display}</span></a>.</> : null}
          </p>
        }
      />
      <section className="section">
        <div className="wrap narrow">
          <SpecialRequestForm />
        </div>
      </section>
    </main>
  );
}

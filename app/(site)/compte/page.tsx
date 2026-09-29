import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { SavedOrders } from "@/components/shop/RememberOrder";
import { LookupForm } from "@/components/shop/Forms";

export const metadata: Metadata = { title: "Mon compte — suivre ma commande", robots: { index: false, follow: true }, alternates: { canonical: "/compte" } };

export default function ComptePage() {
  return (
    <main id="contenu">
      <PageHero
        compact
        crumbs={[{ name: "Mon compte", path: "/compte" }]}
        label="Mon compte"
        title={["Vos commandes"]}
        intro={<p>Pas besoin de mot de passe : retrouvez une commande avec son numéro et l’email utilisé, ou reprenez celles passées depuis cet appareil.</p>}
      />
      <section className="section account">
        <div className="wrap account-grid">
          <div className="account-card">
            <h2 className="h-md">Retrouver une commande</h2>
            <LookupForm />
          </div>
          <div className="account-card">
            <h2 className="h-md">Sur cet appareil</h2>
            <SavedOrders />
          </div>
        </div>
      </section>
    </main>
  );
}

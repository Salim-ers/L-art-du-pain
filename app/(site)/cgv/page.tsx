import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Conditions générales de vente",
  alternates: { canonical: "/cgv" },
  robots: { index: false, follow: true },
};

const todo = "À compléter";

export default function Cgv() {
  return (
    <LegalPage title="Conditions générales de vente">
      <p>Les présentes conditions s’appliquent aux commandes passées sur ce site auprès de {site.legal.publisher ?? site.name} (SIRET : {site.legal.siret ?? todo}), {site.address.street}, {site.address.postalCode} {site.address.city}.</p>
      <h2>Commande</h2>
      <p>La commande est enregistrée après choix d’un créneau de retrait et validation du paiement ou, lorsque proposé, du paiement en boutique. Un email de confirmation récapitule la commande.</p>
      <h2>Prix</h2>
      <p>Les prix sont indiqués en euros toutes taxes comprises. Les prix appliqués sont ceux affichés au moment de la validation de la commande.</p>
      <h2>Paiement</h2>
      <p>Le paiement en ligne est opéré par Stripe. Pour les gâteaux personnalisés, un acompte peut être demandé ; le solde est réglé au retrait.</p>
      <h2>Retrait</h2>
      <p>Les commandes sont à retirer en boutique au créneau choisi. Une commande non retirée le jour prévu ne peut être conservée au-delà de la fermeture, s’agissant de denrées périssables.</p>
      <h2>Rétractation</h2>
      <p>Conformément à l’article L221-28 du Code de la consommation, le droit de rétractation ne s’applique pas aux denrées périssables ni aux biens confectionnés selon les spécifications du client. Toute annulation doit être demandée par téléphone{site.phone ? " au " + site.phone.display : ""} avant le début de la préparation.</p>
      <h2>Allergènes</h2>
      <p>Les allergènes majeurs sont indiqués sur chaque fiche produit. Nos produits sont fabriqués dans un atelier utilisant gluten, œufs, lait, fruits à coque, soja et sésame : des traces sont possibles.</p>
      <h2>Réclamations et médiation</h2>
      <p>Pour toute réclamation, contactez la boutique. À défaut de solution amiable, vous pouvez recourir gratuitement à un médiateur de la consommation : {todo}.</p>
    </LegalPage>
  );
}

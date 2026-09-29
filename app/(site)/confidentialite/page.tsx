import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  alternates: { canonical: "/confidentialite" },
  robots: { index: false, follow: true },
};

export default function Confidentialite() {
  return (
    <LegalPage title="Politique de confidentialité">
      <h2>Données collectées</h2>
      <p>Lors d’une commande, d’une demande de gâteau sur mesure ou d’un message, nous collectons vos nom, prénom, email, téléphone, le contenu de la commande, le créneau de retrait et, le cas échéant, la photo d’inspiration que vous envoyez.</p>
      <h2>Finalités et base légale</h2>
      <p>Ces données servent exclusivement à préparer et suivre votre commande, à vous contacter à son sujet et à respecter nos obligations comptables (exécution du contrat et obligation légale). Aucune donnée n’est vendue ni utilisée à des fins publicitaires.</p>
      <h2>Durée de conservation</h2>
      <p>Les données de commande sont conservées pendant la durée nécessaire à la relation commerciale, puis archivées pendant la durée légale (10 ans pour les pièces comptables). Les photos d’inspiration sont supprimées sur simple demande.</p>
      <h2>Destinataires et sous-traitants</h2>
      <p>Seule l’équipe de {site.name} accède à vos données. Hébergement : Vercel et Supabase (Union européenne). Paiement : Stripe, qui traite vos données bancaires ; nous n’y avons jamais accès. Emails transactionnels : Resend.</p>
      <h2>Cookies et stockage local</h2>
      <p>Aucun cookie publicitaire ni traceur. Votre panier et la liste de vos commandes sont conservés dans le stockage local de votre navigateur, uniquement pour votre confort. Un cookie de session est utilisé pour l’espace d’administration réservé à l’équipe.</p>
      <h2>Services tiers</h2>
      <p>La carte est fournie par OpenStreetMap. Les liens d’itinéraire ouvrent Google Maps ou Waze, soumis à leur propre politique de confidentialité.</p>
      <h2>Vos droits</h2>
      <p>Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation et d’opposition. Pour l’exercer : {site.name}, {site.address.street}, {site.address.postalCode} {site.address.city}{site.phone ? " — " + site.phone.display : ""}. Vous pouvez également saisir la CNIL (cnil.fr).</p>
    </LegalPage>
  );
}

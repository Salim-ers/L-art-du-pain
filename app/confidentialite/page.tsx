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
      <p>Ce site vitrine ne collecte aucune donnée personnelle via formulaire et ne dépose aucun cookie publicitaire.</p>
      <h2>Services tiers</h2>
      <p>La carte est fournie par OpenStreetMap. Les liens d’itinéraire ouvrent Google Maps, soumis à sa propre politique de confidentialité.</p>
      <h2>Contact</h2>
      <p>Pour toute question : {site.name}, {site.address.street}, {site.address.postalCode} {site.address.city}{site.phone ? " — " + site.phone.display : ""}.</p>
    </LegalPage>
  );
}

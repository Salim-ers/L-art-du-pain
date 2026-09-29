import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Mentions légales",
  alternates: { canonical: "/mentions-legales" },
  robots: { index: false, follow: true },
};

const todo = "À compléter";

export default function MentionsLegales() {
  return (
    <LegalPage title="Mentions légales">
      <h2>Éditeur du site</h2>
      <p>{site.legal.publisher ?? todo}<br />{site.address.street}, {site.address.postalCode} {site.address.city}</p>
      <p>SIRET : {site.legal.siret ?? todo}</p>
      {site.phone && <p>Téléphone : {site.phone.display}</p>}
      <h2>Hébergement</h2>
      <p>{site.legal.host}</p>
      <h2>Propriété intellectuelle</h2>
      <p>L’ensemble des contenus de ce site (textes, photographies, logo) est la propriété de {site.name}. Toute reproduction sans autorisation est interdite.</p>
    </LegalPage>
  );
}

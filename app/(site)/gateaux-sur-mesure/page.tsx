import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Faq } from "@/components/Faq";
import { CakeWizard } from "@/components/shop/CakeWizard";
import { customFaq } from "@/content/faq";
import { customConfig } from "@/lib/custom";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gâteau personnalisé et gâteau d’anniversaire à Nogent-sur-Oise",
  description:
    "Créez votre gâteau personnalisé chez L’Art du Pain à Nogent-sur-Oise : anniversaire, mariage, baptême, entreprise. Choisissez parts, saveurs, message et date, envoyez une photo d’inspiration.",
  alternates: { canonical: "/gateaux-sur-mesure" },
};

export default async function SurMesurePage() {
  const [{ cake, modes, depositPercent }, shop] = await Promise.all([customConfig(), getSetting("shop")]);
  return (
    <main id="contenu">
      <PageHero
        compact
        crumbs={[{ name: "Gâteaux sur mesure", path: "/gateaux-sur-mesure" }]}
        label="Gâteaux d’anniversaire & créations personnalisées"
        title={["Créez", <span key="i" className="it accent">votre gâteau.</span>]}
        intro={
          <p>
            Anniversaire, mariage, baptême, naissance ou événement d’entreprise : composez votre gâteau en quelques étapes. Nos pâtissiers le réalisent
            dans notre boutique de Nogent-sur-Oise, pour un retrait à la date de votre choix.
          </p>
        }
      />
      <section className="section">
        <div className="wrap">
          <CakeWizard cake={cake} modes={modes} depositPercent={depositPercent} step={shop.slotMinutes} />
        </div>
      </section>
      <Faq title="Gâteaux personnalisés : vos questions" items={customFaq} />
    </main>
  );
}

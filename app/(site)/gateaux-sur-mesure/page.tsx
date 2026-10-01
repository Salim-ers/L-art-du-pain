import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Faq } from "@/components/Faq";
import { CakeWizard } from "@/components/shop/CakeWizard";
import { customFaq } from "@/content/faq";
import { customConfig } from "@/lib/custom";
import { getSetting } from "@/lib/settings";

// Servie par le CDN, régénérée en arrière-plan (au plus 60 s) et dès qu’une modification est faite dans la gestion.
export const revalidate = 60;

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
        label="Anniversaire, mariage, baptême, naissance, entreprise"
        title={["Un gâteau", <span key="i" className="it accent">imaginé pour vous.</span>]}
        intro={
          <p>
            Composez votre demande en quelques étapes. Nous l’étudions, puis nous vous confirmons la faisabilité et le tarif, pour un retrait
            en boutique à Nogent-sur-Oise.
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

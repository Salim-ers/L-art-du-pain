import { Intro } from "@/components/Intro";
import { Hero } from "@/components/Hero";
import { Families } from "@/components/home/Families";
import { CustomCake } from "@/components/home/CustomCake";
import { Reviews } from "@/components/Reviews";
import { Location } from "@/components/Location";
import { JsonLd } from "@/components/JsonLd";
import { listCategories } from "@/lib/catalog";
import { localBusinessJsonLd } from "@/lib/schema";
import { getSetting } from "@/lib/settings";
import { featuredCampaign, getReviews } from "@/lib/site-data";

// Servie par le CDN, régénérée en arrière-plan (au plus 60 s) et dès qu’une modification est faite dans la gestion.
export const revalidate = 60;

/**
 * Accueil : 1. hero · 2. nos créations · 3. gâteaux sur mesure · 4. avis & réassurance · 5. nous trouver
 * · 6. commandes particulières (appel final, dans le pied de page). La galerie a sa propre page.
 */
export default async function HomePage() {
  const [categories, campaign, reviews, cake, reassurance, catalog] = await Promise.all([
    listCategories(),
    featuredCampaign(),
    getReviews(),
    getSetting("cake"),
    getSetting("reassurance"),
    getSetting("catalog"),
  ]);

  return (
    <>
      <JsonLd data={localBusinessJsonLd({ reviews: reviews.own ? reviews.items : [] })} />
      <Intro />
      <main id="contenu">
        <Hero />
        <Families categories={categories} campaign={campaign} demo={catalog.demo} />
        <CustomCake occasions={cake.occasions} />
        <Reviews items={reviews.items} reviewUrl={reviews.url} reassurance={reassurance.items} summary={reviews.summary} />
        <Location />
      </main>
    </>
  );
}

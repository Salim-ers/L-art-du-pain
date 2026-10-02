import { Intro } from "@/components/Intro";
import { Hero } from "@/components/Hero";
import { Families } from "@/components/home/Families";
import { CustomCake } from "@/components/home/CustomCake";
import { Maison } from "@/components/home/Maison";
import { HomeGallery } from "@/components/home/HomeGallery";
import { Reviews } from "@/components/Reviews";
import { Location } from "@/components/Location";
import { JsonLd } from "@/components/JsonLd";
import { listCategories } from "@/lib/catalog";
import { localBusinessJsonLd } from "@/lib/schema";
import { getSetting } from "@/lib/settings";
import { featuredCampaign, getGallery, getReviews } from "@/lib/site-data";

// Servie par le CDN, régénérée en arrière-plan (au plus 60 s) et dès qu’une modification est faite dans la gestion.
export const revalidate = 60;

/**
 * Accueil : 1. hero · 2. nos créations · 3. gâteaux sur mesure · 4. la boutique · 5. galerie
 * · 6. avis & réassurance · 7. nous trouver · 8. commandes particulières (appel final, dans le pied de page).
 */
export default async function HomePage() {
  const [categories, campaign, gallery, reviews, cake, reassurance, catalog] = await Promise.all([
    listCategories(),
    featuredCampaign(),
    getGallery(),
    getReviews(),
    getSetting("cake"),
    getSetting("reassurance"),
    getSetting("catalog"),
  ]);

  return (
    <>
      <JsonLd data={localBusinessJsonLd({ reviews: reviews.items })} />
      <Intro />
      <main id="contenu">
        <Hero />
        <Families categories={categories} campaign={campaign} demo={catalog.demo} />
        <CustomCake occasions={cake.occasions} />
        <Maison />
        <HomeGallery items={gallery.map((m) => ({ id: m.id, url: m.url, alt: m.alt, caption: m.caption, category: m.category, format: m.format }))} />
        <Reviews items={reviews.items} reviewUrl={reviews.url} reassurance={reassurance.items} />
        <Location />
      </main>
    </>
  );
}

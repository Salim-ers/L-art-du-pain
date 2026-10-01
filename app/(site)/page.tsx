import Link from "next/link";
import { Intro } from "@/components/Intro";
import { Hero } from "@/components/Hero";
import { Gallery } from "@/components/Gallery";
import { Reviews } from "@/components/Reviews";
import { Location } from "@/components/Location";
import { JsonLd } from "@/components/JsonLd";
import { QuickOrder } from "@/components/shop/QuickOrder";
import { ProductGrid } from "@/components/shop/ProductCard";
import { CampaignTeaser, CustomTeaser } from "@/components/Teasers";
import { listProducts } from "@/lib/catalog";
import { localBusinessJsonLd } from "@/lib/schema";
import { featuredCampaign, galleryCarousel, getReviews, quickCards } from "@/lib/site-data";

// Servie par le CDN, régénérée en arrière-plan (au plus 60 s) et dès qu’une modification est faite dans la gestion.
export const revalidate = 60;

/** L'essentiel : commander par rayon, les produits phares avec leurs prix, les rendez-vous du moment, la galerie, l'adresse. */
export default async function HomePage() {
  const [cards, featured, campaign, gallery, reviews] = await Promise.all([
    quickCards(),
    listProducts({ featured: true }),
    featuredCampaign(),
    galleryCarousel(),
    getReviews(),
  ]);

  return (
    <>
      <JsonLd data={localBusinessJsonLd({ reviews: reviews.items })} />
      <Intro />
      <main id="contenu">
        <Hero />
        <QuickOrder cards={cards} />
        {featured.length > 0 && (
          <section className="section shop-group" aria-labelledby="featured">
            <div className="wrap">
              <div className="shop-group-head">
                <h2 className="h-md" id="featured">Les incontournables</h2>
                <Link href="/commander" className="ulink shop-group-more">
                  <span>Tous les produits</span>
                </Link>
              </div>
              <ProductGrid products={featured} showCategory />
            </div>
          </section>
        )}
        <CampaignTeaser campaign={campaign} />
        <CustomTeaser />
        <Gallery items={gallery} />
        <Reviews items={reviews.items} reviewUrl={reviews.url} />
        <Location />
      </main>
    </>
  );
}

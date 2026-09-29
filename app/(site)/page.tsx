import { Intro } from "@/components/Intro";
import { Hero } from "@/components/Hero";
import { Manifesto } from "@/components/Manifesto";
import { Editorial } from "@/components/Editorial";
import { Creations } from "@/components/Creations";
import { SignatureProduct } from "@/components/SignatureProduct";
import { Marquee } from "@/components/Marquee";
import { CraftSection } from "@/components/CraftSection";
import { Breath } from "@/components/Breath";
import { Gallery } from "@/components/Gallery";
import { Reviews } from "@/components/Reviews";
import { Location } from "@/components/Location";
import { LocalSeo } from "@/components/LocalSeo";
import { JsonLd } from "@/components/JsonLd";
import { QuickOrder } from "@/components/shop/QuickOrder";
import { CampaignTeaser, CustomTeaser } from "@/components/Teasers";
import { listProducts } from "@/lib/catalog";
import { localBusinessJsonLd } from "@/lib/schema";
import { creationCats, featuredCampaign, galleryCarousel, getReviews, quickCards } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [cards, cats, featured, campaign, gallery, reviews] = await Promise.all([
    quickCards(),
    creationCats(),
    listProducts({ featured: true }),
    featuredCampaign(),
    galleryCarousel(),
    getReviews(),
  ]);
  const signature = featured.find((p) => p.orderable && p.image) ?? featured[0] ?? null;

  return (
    <>
      <JsonLd data={localBusinessJsonLd({ reviews: reviews.items })} />
      <Intro />
      <main id="contenu">
        <Hero />
        <QuickOrder cards={cards} />
        <Manifesto />
        <Editorial />
        <CampaignTeaser campaign={campaign} />
        <Creations cats={cats} />
        <SignatureProduct product={signature} />
        <Marquee />
        <CustomTeaser />
        <CraftSection />
        <Breath />
        <Gallery items={gallery} />
        <Reviews items={reviews.items} reviewUrl={reviews.url} />
        <LocalSeo reviewUrl={reviews.url} />
        <Location />
      </main>
    </>
  );
}

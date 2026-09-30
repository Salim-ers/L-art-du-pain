import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { CategoryTabs } from "@/components/shop/CategoryTabs";
import { ProductGrid } from "@/components/shop/ProductCard";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { listCategories, listProducts } from "@/lib/catalog";
import { itemListJsonLd } from "@/lib/schema";
import { featuredCampaign } from "@/lib/site-data";
import { pickupWindow } from "@/components/Teasers";
import { clickCollectFaq } from "@/content/faq";

// Servie par le CDN, régénérée en arrière-plan (au plus 60 s) et dès qu’une modification est faite dans la gestion.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Commander en ligne — Click & Collect à Nogent-sur-Oise",
  description:
    "Commandez pains, viennoiseries, pâtisseries et salé en ligne chez L’Art du Pain, boulangerie à Nogent-sur-Oise. Choisissez votre créneau, retirez en boutique.",
  alternates: { canonical: "/commander" },
};

export default async function CommanderPage() {
  const [categories, products, campaign] = await Promise.all([listCategories(), listProducts(), featuredCampaign()]);
  const groups = categories
    .map((c) => ({ c, items: products.filter((p) => p.category?.slug === c.slug && (!p.seasonal || p.campaign?.state === "open")) }))
    .filter((g) => g.items.length);

  return (
    <main id="contenu" className="shop">
      <JsonLd data={itemListJsonLd("Catalogue L’Art du Pain", products.filter((p) => p.orderable))} />
      <PageHero
        compact
        crumbs={[{ name: "Commander", path: "/commander" }]}
        label="Click & Collect — retrait en boutique"
        title={["Commander", <span key="i" className="it accent">en quelques gestes.</span>]}
        intro={<p>Composez votre panier, choisissez le jour et l’heure du retrait, réglez en ligne ou en boutique. Nous préparons tout pour votre arrivée, 28 Avenue Saint-Exupéry à Nogent-sur-Oise.</p>}
      />
      <CategoryTabs categories={categories} current={null} />

      {campaign && campaign.state === "open" && (
        <div className="section">
          <Link href={campaign.kind === "noel" ? "/noel" : "/evenements/" + campaign.slug} className="wrap shop-banner">
            <span className="label label--light">{campaign.name} — précommandes ouvertes</span>
            <span className="shop-banner-title">{campaign.headline ?? campaign.name}</span>
            <span className="shop-banner-meta">{pickupWindow(campaign)} →</span>
          </Link>
        </div>
      )}

      {groups.map(({ c, items }) => (
        <section key={c.id} id={c.slug} className="section shop-group" aria-labelledby={"g-" + c.slug}>
          <div className="wrap">
            <div className="shop-group-head">
              <Reveal as="h2" className="h-md" id={"g-" + c.slug}>{c.name}</Reveal>
              {c.tagline && <Reveal as="p" className="shop-group-tag">{c.tagline}</Reveal>}
              <Link href={"/commander/" + c.slug} className="ulink shop-group-more">
                <span>Voir la sélection</span>
                <span className="arrow" aria-hidden="true">→</span>
              </Link>
            </div>
            <ProductGrid products={items} />
          </div>
        </section>
      ))}

      <Faq title="Click & Collect : comment ça marche ?" items={clickCollectFaq} />
    </main>
  );
}

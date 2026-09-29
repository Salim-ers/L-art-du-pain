import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Creations } from "@/components/Creations";
import { Reveal } from "@/components/Reveal";
import { ProductImage } from "@/components/shop/ProductImage";
import { ProductGrid } from "@/components/shop/ProductCard";
import { listCategories, listProducts } from "@/lib/catalog";
import { creationCats } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nos créations — pains, viennoiseries, pâtisseries à Nogent-sur-Oise",
  description:
    "Découvrez les créations de L’Art du Pain, boulangerie pâtisserie à Nogent-sur-Oise : pains au levain, viennoiseries pur beurre, pâtisseries, gâteaux, salé et gourmandises.",
  alternates: { canonical: "/nos-creations" },
};

export default async function CreationsPage() {
  const [cats, categories, featured] = await Promise.all([creationCats(), listCategories(), listProducts({ featured: true })]);
  return (
    <main id="contenu">
      <PageHero
        crumbs={[{ name: "Nos créations", path: "/nos-creations" }]}
        label="Les créations de la Maison"
        title={["Du fournil", <span key="i" className="it accent">à la vitrine.</span>]}
        intro={<p>Sept familles de créations, préparées chaque jour à Nogent-sur-Oise. Toutes se commandent en ligne et se retirent en boutique.</p>}
      />
      <section className="section fam">
        <div className="wrap fam-grid">
          {categories.map((c, i) => (
            <Reveal key={c.id} as="article" className="fam-card" delay={(i % 3) * 0.08}>
              <Link href={c.slug === "fetes" ? "/noel" : "/commander/" + c.slug} className="fam-link">
                <span className="fam-media">
                  <ProductImage src={c.image} alt={c.name} sizes="(min-width: 900px) 33vw, 100vw" />
                </span>
                <span className="fam-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="fam-title">{c.name}</span>
                {c.tagline && <span className="fam-tag">{c.tagline}</span>}
                {c.description && <span className="fam-desc">{c.description}</span>}
                <span className="fam-cta">Découvrir et commander <span className="arrow" aria-hidden="true">→</span></span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
      {featured.length > 0 && (
        <section className="section shop-group" aria-labelledby="featured">
          <div className="wrap">
            <div className="shop-group-head">
              <h2 className="h-md" id="featured">Les incontournables</h2>
            </div>
            <ProductGrid products={featured} showCategory />
          </div>
        </section>
      )}
      <Creations cats={cats} />
    </main>
  );
}

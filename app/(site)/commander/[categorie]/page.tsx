import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { CategoryTabs } from "@/components/shop/CategoryTabs";
import { ProductGrid } from "@/components/shop/ProductCard";
import { JsonLd } from "@/components/JsonLd";
import { getCategory, listCategories, listProducts } from "@/lib/catalog";
import { itemListJsonLd } from "@/lib/schema";

// Servie par le CDN, régénérée en arrière-plan (au plus 60 s) et dès qu’une modification est faite dans la gestion.
export const revalidate = 60;
// Aucune page générée au build : chacune est créée à sa première visite, puis servie depuis le cache.
export const generateStaticParams = async () => [];

type Props = { params: { categorie: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getCategory(params.categorie);
  if (!c) return {};
  return {
    title: c.seoTitle ?? `${c.name} artisanales à Nogent-sur-Oise — commande en ligne`,
    description: c.seoDescription ?? c.description ?? undefined,
    alternates: { canonical: "/commander/" + c.slug },
    openGraph: c.image ? { images: [{ url: c.image, alt: c.name }] } : undefined,
  };
}

export default async function CategoryPage({ params }: Props) {
  const c = await getCategory(params.categorie);
  if (!c) notFound();
  const [categories, products] = await Promise.all([listCategories(), listProducts({ categoryId: c.id })]);

  return (
    <main id="contenu" className="shop">
      <JsonLd data={itemListJsonLd(c.name, products)} />
      <PageHero
        compact
        crumbs={[{ name: "Commander", path: "/commander" }, { name: c.name, path: "/commander/" + c.slug }]}
        label="Click & Collect — Nogent-sur-Oise"
        title={[c.name, ...(c.tagline ? [<span key="t" className="it accent">{c.tagline}</span>] : [])]}
        intro={c.description ? <p>{c.description}</p> : undefined}
      />
      <CategoryTabs categories={categories} current={c.slug} />
      <section className="section shop-group">
        <div className="wrap">
          {products.length ? (
            <ProductGrid products={products} />
          ) : (
            <p className="empty">Cette sélection revient très vite. <Link href="/commander" className="ulink"><span>Voir tout le catalogue</span></Link></p>
          )}
        </div>
      </section>
    </main>
  );
}

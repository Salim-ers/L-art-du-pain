import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { AddToCart } from "@/components/shop/AddToCart";
import { ProductImage } from "@/components/shop/ProductImage";
import { ProductGrid } from "@/components/shop/ProductCard";
import { pickupWindow } from "@/components/Teasers";
import { getProduct, listProducts } from "@/lib/catalog";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/schema";
import { site } from "@/content/site";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProduct(params.slug);
  if (!p) return {};
  return {
    title: `${p.name} — ${p.category?.name ?? "Boulangerie"} à Nogent-sur-Oise`,
    description: (p.shortDescription ?? p.description ?? p.name) + ` Commandez en ligne chez ${site.name}, retrait en boutique à Nogent-sur-Oise.`,
    alternates: { canonical: "/produit/" + p.slug },
    openGraph: p.image ? { images: [{ url: p.image, alt: p.name }] } : undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const p = await getProduct(params.slug);
  if (!p) notFound();
  const related = p.category ? (await listProducts()).filter((x) => x.category?.slug === p.category!.slug && x.id !== p.id).slice(0, 4) : [];
  const crumbs = [
    { name: "Accueil", path: "/" },
    { name: "Commander", path: "/commander" },
    ...(p.category ? [{ name: p.category.name, path: "/commander/" + p.category.slug }] : []),
    { name: p.name, path: "/produit/" + p.slug },
  ];
  const range = p.campaign ? pickupWindow(p.campaign) : null;

  return (
    <main id="contenu" className="product">
      <JsonLd data={productJsonLd(p)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <div className="section product-top">
        <div className="wrap product-grid">
          <Reveal kind="mask" className="product-media">
            <ProductImage src={p.image} alt={p.name} sizes="(min-width: 960px) 55vw, 100vw" priority />
          </Reveal>
          <div className="product-info">
            <nav className="crumbs" aria-label="Fil d’Ariane">
              <ol>
                {crumbs.slice(0, -1).map((c) => (
                  <li key={c.path}><Link href={c.path}>{c.name}</Link></li>
                ))}
              </ol>
            </nav>
            <h1 className="h-lg product-title">{p.name}</h1>
            {p.shortDescription && <p className="product-lead">{p.shortDescription}</p>}
            {p.campaign && (
              <p className="product-campaign">
                <strong>{p.campaign.name}</strong>
                {range && <span>{range}</span>}
              </p>
            )}
            <AddToCart product={p} />
            <dl className="product-facts">
              {p.description && p.description !== p.shortDescription && (
                <div><dt>Description</dt><dd>{p.description}</dd></div>
              )}
              {p.composition && <div><dt>Composition</dt><dd>{p.composition}</dd></div>}
              <div>
                <dt>Allergènes</dt>
                <dd>{p.allergens.length ? p.allergens.join(", ") : "Nous consulter"} — des traces d’autres allergènes sont possibles (fabrication artisanale).</dd>
              </div>
              <div>
                <dt>Disponibilité</dt>
                <dd>
                  {p.orderable ? "Disponible en Click & Collect" : p.unavailable}
                  {p.leadTimeHours > 0 && ` — à commander ${p.leadTimeHours} h à l’avance`}
                </dd>
              </div>
              <div>
                <dt>Retrait</dt>
                <dd>{site.name}, {site.address.street}, {site.address.postalCode} {site.address.city}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <section className="section shop-group" aria-labelledby="related">
          <div className="wrap">
            <div className="shop-group-head">
              <h2 className="h-md" id="related">Dans la même famille</h2>
            </div>
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </main>
  );
}

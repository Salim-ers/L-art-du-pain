import Link from "next/link";
import type { ProductView } from "@/lib/catalog";
import { money } from "@/lib/format";
import { Reveal } from "../Reveal";
import { ProductImage } from "./ProductImage";
import { QuickAdd } from "./AddToCart";

export function ProductCard({ product: p, index = 0, showCategory }: { product: ProductView; index?: number; showCategory?: boolean }) {
  return (
    <Reveal as="article" className="pcard" delay={(index % 4) * 0.06}>
      <Link href={"/produit/" + p.slug} className="pcard-media" tabIndex={-1} aria-hidden="true">
        <ProductImage src={p.image} alt={p.name} sizes="(min-width: 1100px) 24vw, (min-width: 700px) 33vw, 50vw" />
        {p.demo ? (
          <span className="pcard-badge" data-demo="">Exemple</span>
        ) : (
          (p.unavailable || p.seasonal) && (
            <span className="pcard-badge" data-off={p.unavailable ? "" : undefined}>
              {p.unavailable ?? "Édition de saison"}
            </span>
          )
        )}
      </Link>
      <div className="pcard-body">
        {showCategory && p.category && <span className="pcard-cat">{p.category.name}</span>}
        <h3 className="pcard-title">
          <Link href={"/produit/" + p.slug}>{p.name}</Link>
        </h3>
        {p.shortDescription && <p className="pcard-desc">{p.shortDescription}</p>}
        <div className="pcard-foot">
          <span className="pcard-price">
            {p.fromPrice && <small>dès </small>}
            {money(p.priceCents)}
          </span>
          <QuickAdd product={p} />
        </div>
      </div>
    </Reveal>
  );
}

export function ProductGrid({ products, showCategory }: { products: ProductView[]; showCategory?: boolean }) {
  return (
    <div className="pgrid">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} index={i} showCategory={showCategory} />
      ))}
    </div>
  );
}

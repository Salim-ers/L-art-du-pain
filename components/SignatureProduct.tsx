import Link from "next/link";
import type { ProductView } from "@/lib/catalog";
import { money } from "@/lib/format";
import { ImageReveal } from "./ImageReveal";
import { Reveal } from "./Reveal";
import { AddToCart } from "./shop/AddToCart";

/** La création du moment : produit « mis en avant » choisi depuis l'admin. */
export function SignatureProduct({ product: p }: { product: ProductView | null }) {
  if (!p) return null;
  return (
    <section className="section signature" aria-label="La création du moment">
      <div className="wrap sig-grid">
        <ImageReveal image={{ src: p.image, alt: p.name }} ratio="4 / 5" speed={0.05} sizes="(min-width: 860px) 58vw, 100vw" />
        <div className="sig-text">
          <Reveal as="p" className="label">La création du moment</Reveal>
          <Reveal as="h2" className="h-lg" delay={0.06}>{p.name}</Reveal>
          {p.description && <Reveal as="p" className="body body--sm" delay={0.12}>{p.description}</Reveal>}
          <Reveal as="p" className="sig-price" delay={0.14}>
            {p.fromPrice ? "dès " : ""}{money(p.priceCents)}
            {p.allergens.length > 0 && <span className="sig-allergens">Allergènes : {p.allergens.join(", ")}</span>}
          </Reveal>
          <Reveal delay={0.18}>
            <AddToCart product={p} compact />
          </Reveal>
          <Link href={"/produit/" + p.slug} className="ulink sig-more">
            <span>Voir la fiche</span>
            <span className="arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import type { ProductView } from "@/lib/catalog";
import { money } from "@/lib/format";
import { useCart } from "./CartProvider";

type Props = { product: ProductView; compact?: boolean; tone?: "light" | "dark" };

/** Choix du format, quantité, ajout au panier avec confirmation animée. */
export function AddToCart({ product: p, compact, tone = "light" }: Props) {
  const cart = useCart();
  const firstAvailable = p.variants.find((v) => v.stock !== 0) ?? p.variants[0];
  const [variantId, setVariantId] = useState<string | null>(firstAvailable?.id ?? null);
  const [qty, setQty] = useState(1);
  const [done, setDone] = useState(false);

  const variant = p.variants.find((v) => v.id === variantId) ?? null;
  const unit = variant?.priceCents ?? p.priceCents;
  const stock = variant ? variant.stock : p.stock;
  const max = Math.min(50, stock ?? 50);
  const disabled = !p.orderable || stock === 0;

  const add = () => {
    if (disabled) return;
    cart.add({
      productId: p.id,
      variantId: variant?.id ?? null,
      quantity: qty,
      name: p.name,
      variantLabel: variant?.label ?? null,
      unitCents: unit,
      image: p.image,
      slug: p.slug,
    });
    setDone(true);
    window.setTimeout(() => setDone(false), 1600);
  };

  return (
    <div className={"atc atc--" + tone + (compact ? " atc--compact" : "")}>
      {p.variants.length > 0 && (
        <fieldset className="atc-variants">
          <legend className="atc-legend">Format</legend>
          {p.variants.map((v) => (
            <label key={v.id} className="chip" data-on={v.id === variantId ? "" : undefined} data-off={v.stock === 0 ? "" : undefined}>
              <input type="radio" name={"v-" + p.id} value={v.id} checked={v.id === variantId} disabled={v.stock === 0} onChange={() => setVariantId(v.id)} />
              <span className="chip-label">{v.label}</span>
              <span className="chip-price">{v.stock === 0 ? "Épuisé" : money(v.priceCents)}</span>
            </label>
          ))}
        </fieldset>
      )}

      {stock !== null && stock > 0 && stock <= 5 && <p className="atc-stock">Plus que {stock} disponible{stock > 1 ? "s" : ""}</p>}

      <div className="atc-row">
        <div className="qty" aria-label="Quantité">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1 || disabled} aria-label="Retirer une unité">−</button>
          <output aria-live="polite">{qty}</output>
          <button type="button" onClick={() => setQty((q) => Math.min(max, q + 1))} disabled={qty >= max || disabled} aria-label="Ajouter une unité">+</button>
        </div>
        <button type="button" className="atc-btn" onClick={add} disabled={disabled} data-done={done ? "" : undefined}>
          <span className="atc-btn-main">{disabled ? p.unavailable ?? "Indisponible" : "Ajouter au panier"}</span>
          {!disabled && <span className="atc-btn-price">{money(unit * qty)}</span>}
          <span className="atc-btn-done" aria-hidden="true">Ajouté ✓</span>
        </button>
      </div>
    </div>
  );
}

/** Ajout rapide depuis une carte (produits sans format uniquement). */
export function QuickAdd({ product: p }: { product: ProductView }) {
  const cart = useCart();
  const [done, setDone] = useState(false);
  if (!p.orderable) return <span className="qa-off">{p.unavailable}</span>;
  if (p.variants.length) {
    return (
      <a href={"/produit/" + p.slug} className="qa">
        Choisir
      </a>
    );
  }
  return (
    <button
      type="button"
      className="qa"
      data-done={done ? "" : undefined}
      aria-label={"Ajouter " + p.name + " au panier"}
      onClick={() => {
        cart.add({ productId: p.id, variantId: null, quantity: 1, name: p.name, variantLabel: null, unitCents: p.priceCents, image: p.image, slug: p.slug });
        setDone(true);
        window.setTimeout(() => setDone(false), 1400);
      }}
    >
      <span className="qa-plus" aria-hidden="true">{done ? "✓" : "+"}</span>
      <span>{done ? "Ajouté" : "Ajouter"}</span>
    </button>
  );
}

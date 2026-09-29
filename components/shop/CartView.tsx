"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { checkCart, type CartCheck } from "@/app/(site)/actions";
import { formatDate, money } from "@/lib/format";
import { useCart } from "./CartProvider";

export function CartView() {
  const cart = useCart();
  const [check, setCheck] = useState<CartCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const key = cart.lines.map((l) => `${l.productId}:${l.variantId}:${l.quantity}`).join("|");

  // Prix et disponibilités actualisés côté serveur à chaque modification.
  useEffect(() => {
    if (!cart.ready) return;
    if (!cart.lines.length) {
      setCheck(null);
      return;
    }
    let live = true;
    checkCart(cart.lines.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity }))).then((r) => {
      if (!live) return;
      if (r.ok) {
        setCheck(r.cart);
        setError(null);
      } else setError(r.error);
    });
    return () => {
      live = false;
    };
  }, [key, cart.ready]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!cart.ready) return <div className="cart-skel" aria-busy="true" />;

  if (!cart.lines.length) {
    return (
      <div className="cart-empty">
        <p className="h-md">Votre panier est vide.</p>
        <p className="body body--sm">Le pain du matin, une viennoiserie, un gâteau à partager : tout se commande en ligne et se retire en boutique.</p>
        <Link href="/commander" className="btn btn--solid">Découvrir le catalogue</Link>
      </div>
    );
  }

  const problems = check?.lines.filter((l) => l.problem) ?? [];
  const lineInfo = (productId: string, variantId: string | null) => check?.lines.find((l) => l.productId === productId && l.variantId === variantId);
  const subtotal = check?.subtotal ?? cart.subtotal;

  return (
    <div className="cart">
      <ul className="cart-lines">
        {cart.lines.map((l) => {
          const info = lineInfo(l.productId, l.variantId);
          const unit = info && !info.problem ? info.unitCents : l.unitCents;
          return (
            <li key={l.productId + (l.variantId ?? "")} className="cart-line" data-problem={info?.problem ? "" : undefined}>
              <Link href={"/produit/" + l.slug} className="cart-thumb" tabIndex={-1} aria-hidden="true">
                {l.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.image} alt="" />
                ) : (
                  <span />
                )}
              </Link>
              <div className="cart-main">
                <Link href={"/produit/" + l.slug} className="cart-name">{l.name}</Link>
                {l.variantLabel && <span className="cart-variant">{l.variantLabel}</span>}
                <span className="cart-unit">{money(unit)} l’unité</span>
                {info?.problem && <span className="cart-problem">{info.problem}</span>}
              </div>
              <div className="cart-side">
                <div className="qty qty--sm">
                  <button type="button" onClick={() => cart.setQty(l.productId, l.variantId, l.quantity - 1)} aria-label="Retirer une unité">−</button>
                  <output>{l.quantity}</output>
                  <button type="button" onClick={() => cart.setQty(l.productId, l.variantId, l.quantity + 1)} disabled={l.quantity >= 50} aria-label="Ajouter une unité">+</button>
                </div>
                <span className="cart-total">{money(unit * l.quantity)}</span>
                <button type="button" className="cart-remove" onClick={() => cart.remove(l.productId, l.variantId)}>Retirer</button>
              </div>
            </li>
          );
        })}
      </ul>

      <aside className="cart-summary">
        <h2 className="h-md">Récapitulatif</h2>
        {check?.campaign && (
          <p className="notice">
            Votre panier contient des créations « {check.campaign.name} » : le retrait se fera à l’une des dates prévues
            {check.campaign.dates.length ? ` (du ${formatDate(check.campaign.dates[0], "short")} au ${formatDate(check.campaign.dates[check.campaign.dates.length - 1], "short")})` : ""}.
          </p>
        )}
        {check && check.leadHours >= 24 && <p className="notice">Certaines créations demandent {check.leadHours} h de préparation : les créneaux proposés en tiennent compte.</p>}
        {error && <p className="notice notice--err">{error}</p>}
        {problems.length > 0 && <p className="notice notice--err">Retirez les produits indisponibles pour continuer.</p>}
        <dl className="sum">
          <div><dt>Sous-total</dt><dd>{money(subtotal)}</dd></div>
          <div><dt>Retrait en boutique</dt><dd>Offert</dd></div>
          <div className="sum-total"><dt>Total</dt><dd>{money(subtotal)}</dd></div>
        </dl>
        <Link href="/commande" className="btn btn--solid cart-go" aria-disabled={problems.length > 0 || !check}>
          Choisir mon créneau de retrait →
        </Link>
        <Link href="/commander" className="ulink cart-continue"><span>Continuer mes achats</span></Link>
      </aside>
    </div>
  );
}

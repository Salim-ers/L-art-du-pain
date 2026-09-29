"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { checkCart, checkPromo, pickupDays, submitOrder, type CartCheck } from "@/app/(site)/actions";
import { site } from "@/content/site";
import { formatDate, formatTime, money } from "@/lib/format";
import type { PickupDay } from "@/lib/slots";
import { useCart } from "./CartProvider";
import { SlotPicker } from "./SlotPicker";

type Props = { card: boolean; onSite: boolean; step: number; cancelled: boolean };

/** Tunnel : créneau → coordonnées → paiement. Léger, sans animation lourde, pensé pour le pouce. */
export function Checkout({ card, onSite, step, cancelled }: Props) {
  const cart = useCart();
  const lines = useMemo(() => cart.lines.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity })), [cart.lines]);
  const [check, setCheck] = useState<CartCheck | null>(null);
  const [days, setDays] = useState<PickupDay[] | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", note: "" });
  const [method, setMethod] = useState<"card" | "on_site">(card ? "card" : "on_site");
  const [promo, setPromo] = useState("");
  const [promoState, setPromoState] = useState<{ code: string; discount: number; label: string } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(cancelled ? "Le paiement a été annulé : aucun montant n’a été prélevé. Vous pouvez réessayer." : null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("adp-contact") || "null");
      if (saved) setForm((f) => ({ ...f, ...saved, note: "" }));
    } catch {}
  }, []);

  const key = JSON.stringify(lines);
  useEffect(() => {
    if (!cart.ready || !lines.length) return;
    let live = true;
    Promise.all([checkCart(lines), pickupDays(lines)]).then(([c, d]) => {
      if (!live) return;
      if (c.ok) setCheck(c.cart);
      if (d.ok) {
        setDays(d.days);
        const first = d.days.find((x) => x.slots.some((s) => !s.full));
        setDate((cur) => (cur && d.days.some((x) => x.date === cur) ? cur : first?.date ?? null));
      } else setError(d.error);
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
        <Link href="/commander" className="btn btn--solid">Découvrir le catalogue</Link>
      </div>
    );
  }

  const subtotal = check?.subtotal ?? cart.subtotal;
  const discount = promoState?.discount ?? 0;
  const total = subtotal - discount;
  const problems = check?.lines.some((l) => l.problem);

  const applyPromo = async () => {
    setPromoError(null);
    const r = await checkPromo(promo, lines);
    if (r.ok) setPromoState({ code: promo.trim(), discount: r.discount, label: r.label });
    else {
      setPromoState(null);
      setPromoError(r.error);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!date || !time) return setError("Choisissez un jour et un créneau de retrait.");
    if (!terms) return setError("Merci d’accepter les conditions générales de vente.");
    setBusy(true);
    setError(null);
    try {
      localStorage.setItem("adp-contact", JSON.stringify({ firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone }));
    } catch {}
    const r = await submitOrder({
      items: lines,
      pickupDate: date,
      pickupTime: time,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      note: form.note,
      paymentMethod: method,
      promoCode: promoState?.code ?? null,
      acceptTerms: true,
    });
    if (!r.ok) {
      setBusy(false);
      setError(r.error);
      // Le créneau a pu se remplir : on rafraîchit.
      const d = await pickupDays(lines);
      if (d.ok) setDays(d.days);
      return;
    }
    cart.clear();
    window.location.href = r.redirect;
  };

  const field = (name: keyof typeof form, label: string, type = "text", auto?: string) => (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        name={name}
        autoComplete={auto}
        required
        value={form[name]}
        onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
        inputMode={type === "tel" ? "tel" : type === "email" ? "email" : undefined}
      />
    </label>
  );

  return (
    <form className="checkout" onSubmit={submit} noValidate={false}>
      <div className="checkout-steps">
        <section className="co-step" aria-labelledby="s1">
          <h2 className="co-title" id="s1"><span>01</span> Jour et heure de retrait</h2>
          <p className="co-where">
            {site.name} — {site.address.street}, {site.address.postalCode} {site.address.city}
          </p>
          {days === null ? (
            <div className="cart-skel cart-skel--sm" aria-busy="true" />
          ) : (
            <SlotPicker
              days={days}
              date={date}
              time={time}
              step={step}
              onDate={(d) => {
                setDate(d);
                setTime(null);
              }}
              onTime={setTime}
            />
          )}
        </section>

        <section className="co-step" aria-labelledby="s2">
          <h2 className="co-title" id="s2"><span>02</span> Vos coordonnées</h2>
          <div className="fields">
            {field("firstName", "Prénom", "text", "given-name")}
            {field("lastName", "Nom", "text", "family-name")}
            {field("phone", "Téléphone", "tel", "tel")}
            {field("email", "Email", "email", "email")}
          </div>
          <label className="field">
            <span>Instructions (facultatif)</span>
            <textarea
              name="note"
              rows={3}
              maxLength={500}
              placeholder="Ex. : écrire « Joyeux Noël Mamie » sur la bûche"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </label>
        </section>

        <section className="co-step" aria-labelledby="s3">
          <h2 className="co-title" id="s3"><span>03</span> Paiement</h2>
          <div className="pay-options" role="radiogroup" aria-label="Moyen de paiement">
            {card && (
              <label className="pay" data-on={method === "card" ? "" : undefined}>
                <input type="radio" name="method" checked={method === "card"} onChange={() => setMethod("card")} />
                <span className="pay-title">Payer maintenant</span>
                <span className="pay-sub">Carte bancaire, Apple Pay, Google Pay — paiement sécurisé par Stripe</span>
              </label>
            )}
            {onSite && (
              <label className="pay" data-on={method === "on_site" ? "" : undefined}>
                <input type="radio" name="method" checked={method === "on_site"} onChange={() => setMethod("on_site")} />
                <span className="pay-title">Payer en boutique</span>
                <span className="pay-sub">Réglez au moment du retrait</span>
              </label>
            )}
          </div>
          {!card && !onSite && <p className="notice notice--err">Aucun moyen de paiement n’est disponible actuellement.</p>}
        </section>
      </div>

      <aside className="cart-summary co-summary">
        <h2 className="h-md">Votre commande</h2>
        <ul className="co-lines">
          {cart.lines.map((l) => {
            const info = check?.lines.find((x) => x.productId === l.productId && x.variantId === l.variantId);
            return (
              <li key={l.productId + (l.variantId ?? "")} data-problem={info?.problem ? "" : undefined}>
                <span>
                  {l.quantity} × {l.name}
                  {l.variantLabel && <small> — {l.variantLabel}</small>}
                  {info?.problem && <small className="cart-problem"> {info.problem}</small>}
                </span>
                <span>{money((info && !info.problem ? info.unitCents : l.unitCents) * l.quantity)}</span>
              </li>
            );
          })}
        </ul>
        <div className="promo">
          <input type="text" placeholder="Code promo" value={promo} onChange={(e) => setPromo(e.target.value)} aria-label="Code promo" maxLength={40} />
          <button type="button" onClick={applyPromo} disabled={!promo.trim()}>Appliquer</button>
        </div>
        {promoError && <p className="field-err">{promoError}</p>}
        <dl className="sum">
          <div><dt>Sous-total</dt><dd>{money(subtotal)}</dd></div>
          {promoState && <div><dt>{promoState.label}</dt><dd>− {money(discount)}</dd></div>}
          {date && time && (
            <div><dt>Retrait</dt><dd>{formatDate(date)}, {formatTime(time)}</dd></div>
          )}
          <div className="sum-total"><dt>Total</dt><dd>{money(total)}</dd></div>
        </dl>
        <label className="check">
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} required />
          <span>J’accepte les <Link href="/cgv" target="_blank" className="ulink"><span>conditions générales de vente</span></Link>.</span>
        </label>
        {error && <p className="notice notice--err" role="alert">{error}</p>}
        <button type="submit" className="btn btn--solid co-submit" disabled={busy || !date || !time || !!problems || (!card && !onSite)}>
          {busy ? "Un instant…" : method === "card" ? `Payer ${money(total)}` : "Valider ma commande"}
        </button>
        <p className="co-legal">Vos données servent uniquement à préparer votre commande et à vous prévenir. <Link href="/confidentialite" className="ulink"><span>Confidentialité</span></Link></p>
      </aside>
    </form>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Directions } from "@/components/Directions";
import { RememberOrder } from "@/components/shop/RememberOrder";
import { site } from "@/content/site";
import { formatDate, formatTime, money } from "@/lib/format";
import { customerSteps, orderStatusLabel, paymentStatusLabel } from "@/lib/labels";
import { findOrderForCustomer, reconcileOrderPayment } from "@/lib/orders";
import { getReviews } from "@/lib/site-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Suivi de commande", robots: { index: false, follow: false } };

type Props = { searchParams: { n?: string; t?: string; ok?: string; paid?: string } };

export default async function SuiviPage({ searchParams }: Props) {
  const { n = "", t = "" } = searchParams;
  let found = n && t ? await findOrderForCustomer(n, { token: t }) : null;
  if (found && found.order.paymentStatus === "pending" && searchParams.paid) {
    await reconcileOrderPayment(found.order.id);
    found = await findOrderForCustomer(n, { token: t });
  }
  if (!found) {
    return (
      <main id="contenu" className="section flow">
        <div className="wrap narrow">
          <h1 className="h-lg">Commande introuvable</h1>
          <p className="body">Le lien semble incomplet. Retrouvez votre commande depuis <Link href="/compte" className="ulink"><span>Mon compte</span></Link> avec son numéro et votre email.</p>
        </div>
      </main>
    );
  }
  const { order: o, items } = found;
  const reviews = await getReviews();
  const stepIndex = customerSteps.findIndex((s) => s.key.includes(o.status));
  const fresh = searchParams.ok || searchParams.paid;
  const awaitingPayment = o.paymentMethod === "card" && o.paymentStatus === "pending";

  return (
    <main id="contenu" className="section flow">
      <RememberOrder n={o.number} t={o.accessToken} kind="order" label={`Retrait le ${formatDate(o.pickupDate, "short")} à ${formatTime(o.pickupTime)}`} />
      <div className="wrap track">
        <header className="track-head">
          <p className="label">Commande n° {o.number}</p>
          <h1 className="h-lg">
            {o.status === "cancelled"
              ? "Commande annulée"
              : awaitingPayment
                ? "Paiement en cours de validation"
                : fresh
                  ? <>Merci {o.firstName},<br /><span className="it accent">c’est noté.</span></>
                  : orderStatusLabel[o.status]}
          </h1>
          {fresh && !awaitingPayment && o.status !== "cancelled" && (
            <p className="body">Un email de confirmation vient de vous être envoyé à {o.email}. Nous vous prévenons dès que votre commande est prête.</p>
          )}
          {awaitingPayment && <p className="notice">Nous attendons la confirmation de votre banque. Actualisez cette page dans un instant.</p>}
        </header>

        {o.status !== "cancelled" && (
          <ol className="steps" aria-label="Avancement">
            {customerSteps.map((s, i) => (
              <li key={s.label} data-done={i <= stepIndex ? "" : undefined} data-current={i === stepIndex ? "" : undefined}>
                <span className="steps-dot" aria-hidden="true" />
                <span>{s.label}</span>
              </li>
            ))}
          </ol>
        )}

        <div className="track-grid">
          <section className="track-card">
            <h2 className="track-h">Retrait</h2>
            <p className="track-big">{formatDate(o.pickupDate)}<br />{formatTime(o.pickupTime)}</p>
            <p className="body body--sm">{site.name}<br />{site.address.street}<br />{site.address.postalCode} {site.address.city}</p>
            <Directions reviewUrl={reviews.url} withOrder={false} />
          </section>
          <section className="track-card">
            <h2 className="track-h">Détail</h2>
            <ul className="co-lines">
              {items.map((i) => (
                <li key={i.id}>
                  <span>{i.quantity} × {i.name}{i.variantLabel && <small> — {i.variantLabel}</small>}</span>
                  <span>{money(i.unitPriceCents * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="sum">
              {o.discountCents > 0 && <div><dt>Remise</dt><dd>− {money(o.discountCents)}</dd></div>}
              <div className="sum-total"><dt>Total</dt><dd>{money(o.totalCents)}</dd></div>
              <div><dt>Paiement</dt><dd>{paymentStatusLabel[o.paymentStatus]}</dd></div>
              {o.amountPaidCents > 0 && o.amountPaidCents < o.totalCents && (
                <div><dt>Reste à régler en boutique</dt><dd>{money(o.totalCents - o.amountPaidCents)}</dd></div>
              )}
            </dl>
            {o.customerNote && <p className="track-note">« {o.customerNote} »</p>}
          </section>
        </div>
        <p className="body body--sm">Une question ? {site.phone ? <a className="ulink" href={"tel:" + site.phone.tel}><span>Appelez-nous au {site.phone.display}</span></a> : null}</p>
      </div>
    </main>
  );
}

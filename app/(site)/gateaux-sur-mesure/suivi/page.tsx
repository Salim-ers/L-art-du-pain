import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RememberOrder } from "@/components/shop/RememberOrder";
import { acceptQuoteWithoutDeposit, customCheckout, depositOf, findCustomForCustomer, reconcileCustomPayment } from "@/lib/custom";
import { formatDate, formatTime, money } from "@/lib/format";
import { customStatusLabel } from "@/lib/labels";
import { limitOrThrow } from "@/lib/security";
import { site } from "@/content/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Votre gâteau sur mesure", robots: { index: false, follow: false } };

type Props = { searchParams: { n?: string; t?: string; ok?: string; paid?: string; err?: string } };

async function payQuote(fd: FormData) {
  "use server";
  limitOrThrow("quote-pay", 10, 600);
  const c = await findCustomForCustomer(String(fd.get("n") ?? ""), String(fd.get("t") ?? ""));
  if (!c || c.status !== "quote_sent") redirect("/compte");
  const back = `/gateaux-sur-mesure/suivi?n=${encodeURIComponent(c.number)}&t=${c.accessToken}`;
  if (depositOf(c) === 0) {
    await acceptQuoteWithoutDeposit(c);
    redirect(back + "&ok=1");
  }
  let url: string;
  try {
    url = await customCheckout(c);
  } catch {
    redirect(back + "&err=1");
  }
  redirect(url);
}

export default async function CustomTrackPage({ searchParams }: Props) {
  const { n = "", t = "" } = searchParams;
  let c = n && t ? await findCustomForCustomer(n, t) : null;
  if (c && searchParams.paid) {
    await reconcileCustomPayment(c.id);
    c = await findCustomForCustomer(n, t);
  }
  if (!c) {
    return (
      <main id="contenu" className="section flow">
        <div className="wrap narrow">
          <h1 className="h-lg">Demande introuvable</h1>
          <p className="body">Le lien semble incomplet. <Link href="/gateaux-sur-mesure" className="ulink"><span>Créer un gâteau</span></Link></p>
        </div>
      </main>
    );
  }
  const deposit = depositOf(c);

  return (
    <main id="contenu" className="section flow">
      <RememberOrder n={c.number} t={c.accessToken} kind="custom" label={`${c.kind === "special" ? "Demande" : "Gâteau"} ${c.occasion.toLowerCase()} — ${formatDate(c.desiredDate, "short")}`} />
      <div className="wrap track">
        <header className="track-head">
          <p className="label">{c.kind === "special" ? "Commande particulière" : "Gâteau sur mesure"} — {c.number}</p>
          <h1 className="h-lg">
            {searchParams.ok || searchParams.paid ? <>Demande envoyée.<br /><span className="it accent">Merci {c.firstName}.</span></> : customStatusLabel[c.status]}
          </h1>
          {c.status === "pending" && <p className="body">Ce n’est pas encore une commande : la boulangerie étudie votre demande, puis vous confirme la faisabilité et le tarif définitif par email ou par téléphone.</p>}
          {searchParams.err && <p className="notice notice--err">Le paiement n’a pas pu démarrer. Merci de réessayer.</p>}
        </header>

        {c.status === "quote_sent" && (
          <section className="track-card quote" id="payer">
            <h2 className="track-h">Votre demande est validée</h2>
            <p className="track-big">{money(c.quoteCents ?? 0)}</p>
            {c.adminMessage && <p className="body body--sm">{c.adminMessage}</p>}
            <form action={payQuote}>
              <input type="hidden" name="n" value={c.number} />
              <input type="hidden" name="t" value={c.accessToken} />
              <button className="btn btn--solid" type="submit">
                {deposit > 0 ? `Accepter et verser l’acompte de ${money(deposit)}` : "Accepter le devis"}
              </button>
            </form>
            <p className="co-legal">Paiement sécurisé par Stripe. Le solde se règle en boutique.</p>
          </section>
        )}
        {c.status === "changes_requested" && c.adminMessage && (
          <section className="track-card"><h2 className="track-h">Notre message</h2><p className="body">{c.adminMessage}</p></section>
        )}

        <div className="track-grid">
          <section className="track-card">
            <h2 className="track-h">{c.kind === "special" ? "Votre demande" : "Votre gâteau"}</h2>
            <dl className="recap">
              <div><dt>{c.kind === "special" ? "Type" : "Occasion"}</dt><dd>{c.occasion}</dd></div>
              <div><dt>{c.kind === "special" ? "Quantité" : "Personnes"}</dt><dd>{c.servings}</dd></div>
              {c.kind !== "special" && <div><dt>Gâteau</dt><dd>{c.cakeType}</dd></div>}
              {c.flavors.length > 0 && <div><dt>Saveurs</dt><dd>{c.flavors.join(" / ")}</dd></div>}
              {c.kind === "special" && c.comment && <div><dt>Précisions</dt><dd>{c.comment}</dd></div>}
              {c.message && <div><dt>Message</dt><dd>« {c.message} »</dd></div>}
              {c.estimateCents !== null && c.status !== "quote_sent" && <div><dt>Estimation</dt><dd>{money(c.quoteCents ?? c.estimateCents)}</dd></div>}
            </dl>
          </section>
          <section className="track-card">
            <h2 className="track-h">Date souhaitée</h2>
            <p className="track-big">{formatDate(c.desiredDate)}{c.desiredTime && <><br />{formatTime(c.desiredTime)}</>}</p>
            <p className="body body--sm">{site.name}<br />{site.address.street}<br />{site.address.postalCode} {site.address.city}</p>
          </section>
        </div>
      </div>
    </main>
  );
}

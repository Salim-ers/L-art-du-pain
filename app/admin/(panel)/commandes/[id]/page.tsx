import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, PageTitle, PayBadge, StatusBadge } from "@/components/admin/bits";
import { PrintButton, Submit } from "@/components/admin/ui";
import { site } from "@/content/site";
import { getOrder } from "@/lib/admin";
import { hasRole, requirePage } from "@/lib/auth/session";
import { formatDate, formatDateTime, formatTime, money } from "@/lib/format";
import { orderStatusLabel } from "@/lib/labels";
import type { OrderStatus } from "@/lib/db/schema";
import { orderMarkPaid, orderNotify, orderStatus, orderUpdate } from "../../../actions";

export const metadata = { title: "Commande" };

const transitions: { to: OrderStatus; label: string; cls?: string }[] = [
  { to: "confirmed", label: "Confirmer" },
  { to: "in_preparation", label: "Marquer « En préparation »" },
  { to: "ready", label: "Marquer « Prête »", cls: "abtn--ok" },
  { to: "collected", label: "Marquer « Retirée »" },
];

export default async function OrderPage({ params }: { params: { id: string } }) {
  const user = await requirePage("STAFF");
  if (!/^[0-9a-f-]{36}$/.test(params.id)) notFound();
  const data = await getOrder(params.id);
  if (!data) notFound();
  const { order: o, items, payments, notifications, custom, event } = data;
  const back = "/admin/commandes/" + o.id;
  const due = o.totalCents - o.amountPaidCents;
  const smsText = encodeURIComponent(`L’Art du Pain : votre commande ${o.number} est prête. À tout de suite !`);

  const statusForm = (to: OrderStatus, label: string, cls = "", confirm?: string) => (
    <form action={orderStatus} key={to}>
      <input type="hidden" name="id" value={o.id} />
      <input type="hidden" name="status" value={to} />
      <input type="hidden" name="back" value={back} />
      <Submit className={"abtn " + cls} confirm={confirm}>{label}</Submit>
    </form>
  );

  return (
    <div className="aorder">
      <PageTitle title={`Commande #${o.number}`} sub={<>Passée le {formatDateTime(o.createdAt)}{event && <> — campagne <strong>{event.name}</strong></>}{o.kind === "custom" && " — gâteau sur mesure"}</>}>
        <StatusBadge status={o.status} />
        <PayBadge status={o.paymentStatus} />
        <PrintButton />
      </PageTitle>

      <div className="aorder-actions noprint">
        {transitions.filter((t) => t.to !== o.status && o.status !== "cancelled").map((t) => statusForm(t.to, t.label, t.cls))}
        {o.status !== "cancelled" && statusForm("cancelled", "Annuler la commande", "abtn--danger", "Annuler cette commande ? Le stock sera remis en vente et le client prévenu par email.")}
      </div>

      <div className="agrid">
        <div className="astack agrid-wide">
          <Card title="Commande">
            <table className="atable atable--plain">
              <tbody>
                {items.map((i) => (
                  <tr key={i.id}>
                    <td className="num strong">{i.quantity} ×</td>
                    <td>{i.name}{i.variantLabel && <span className="amuted"> — {i.variantLabel}</span>}{i.note && <div className="amuted">{i.note}</div>}</td>
                    <td className="num">{money(i.unitPriceCents * i.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {o.discountCents > 0 && <tr><td /><td>Remise</td><td className="num">− {money(o.discountCents)}</td></tr>}
                <tr><td /><td className="strong">Total</td><td className="num strong">{money(o.totalCents)}</td></tr>
                <tr><td /><td>Déjà payé</td><td className="num">{money(o.amountPaidCents)}</td></tr>
                {due > 0 && o.status !== "cancelled" && <tr><td /><td className="strong">Reste à encaisser</td><td className="num strong">{money(due)}</td></tr>}
              </tfoot>
            </table>
            {o.customerNote && <p className="ainstr">Instructions : « {o.customerNote} »</p>}
            {custom && (
              <p><Link href={"/admin/sur-mesure/" + custom.id} className="alink">Voir la demande sur mesure {custom.number} →</Link></p>
            )}
          </Card>

          <Card title="Modifier">
            <form action={orderUpdate} className="aform aform--grid">
              <input type="hidden" name="id" value={o.id} />
              <input type="hidden" name="back" value={back} />
              <label className="afield"><span>Date de retrait</span><input type="date" name="pickupDate" defaultValue={o.pickupDate} required /></label>
              <label className="afield"><span>Heure</span><input type="time" name="pickupTime" defaultValue={o.pickupTime} step={300} required /></label>
              <label className="afield afield--full"><span>Instructions client</span><input name="customerNote" defaultValue={o.customerNote ?? ""} maxLength={500} /></label>
              <label className="afield afield--full"><span>Note interne (non visible du client)</span><textarea name="internalNote" defaultValue={o.internalNote ?? ""} rows={3} maxLength={2000} /></label>
              <div className="afield--full"><Submit>Enregistrer</Submit></div>
            </form>
          </Card>
        </div>

        <div className="astack">
          <Card title="Client">
            <p className="abig">{o.firstName} {o.lastName}</p>
            <p><a href={"tel:" + o.phone} className="alink">{o.phone}</a><br /><a href={"mailto:" + o.email} className="alink">{o.email}</a></p>
            {o.customerId && <Link href={"/admin/clients/" + o.customerId} className="alink">Fiche client →</Link>}
            <div className="abtns noprint">
              <a href={"tel:" + o.phone} className="abtn abtn--ghost abtn--sm">Appeler le client</a>
              <a href={`sms:${o.phone}?&body=${smsText}`} className="abtn abtn--ghost abtn--sm">Envoyer SMS</a>
              <a href={`mailto:${o.email}?subject=${encodeURIComponent("Votre commande " + o.number + " — " + site.name)}`} className="abtn abtn--ghost abtn--sm">Envoyer email</a>
            </div>
          </Card>
          <Card title="Retrait">
            <p className="abig">{formatDate(o.pickupDate)}<br />{formatTime(o.pickupTime)}</p>
          </Card>
          <Card title="Paiement">
            <p className="abig">{money(o.totalCents)} <PayBadge status={o.paymentStatus} /></p>
            <p className="amuted">{o.paymentMethod === "card" ? "Paiement en ligne (Stripe)" : "Paiement en boutique"}</p>
            {due > 0 && o.status !== "cancelled" && hasRole(user, "ADMIN") && (
              <form action={orderMarkPaid} className="noprint">
                <input type="hidden" name="id" value={o.id} />
                <input type="hidden" name="back" value={back} />
                <Submit className="abtn abtn--sm" confirm={`Enregistrer l’encaissement de ${money(due)} en boutique ?`}>Encaisser {money(due)} en boutique</Submit>
              </form>
            )}
            {payments.length > 0 && (
              <ul className="alist">
                {payments.map((p) => (
                  <li key={p.id}>{formatDateTime(p.createdAt)} — {p.provider === "stripe" ? "Stripe" : "Boutique"} — {money(p.amountCents)} — {p.status}</li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Prévenir le client" className="noprint">
            <div className="abtns">
              {(["received", "confirmed", "ready"] as const).map((k) => (
                <form action={orderNotify} key={k}>
                  <input type="hidden" name="id" value={o.id} />
                  <input type="hidden" name="kind" value={k} />
                  <input type="hidden" name="back" value={back} />
                  <Submit className="abtn abtn--ghost abtn--sm">Email « {k === "received" ? "reçue" : k === "confirmed" ? "confirmée" : "prête"} »</Submit>
                </form>
              ))}
              <form action={orderNotify}>
                <input type="hidden" name="id" value={o.id} />
                <input type="hidden" name="kind" value="sms-ready" />
                <input type="hidden" name="back" value={back} />
                <Submit className="abtn abtn--ghost abtn--sm">SMS « prête » (fournisseur)</Submit>
              </form>
            </div>
            {notifications.length > 0 && (
              <ul className="alist">
                {notifications.map((n) => (
                  <li key={n.id}>{formatDateTime(n.createdAt)} — {n.channel} — {n.subject ?? n.type} — <span className={"astatus-" + n.status}>{n.status}</span></li>
                ))}
              </ul>
            )}
          </Card>
          <p className="amuted">Statut actuel : {orderStatusLabel[o.status]}{o.readyAt && ` — prête à ${formatDateTime(o.readyAt)}`}{o.collectedAt && ` — retirée à ${formatDateTime(o.collectedAt)}`}</p>
        </div>
      </div>
    </div>
  );
}

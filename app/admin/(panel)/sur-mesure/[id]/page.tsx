/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { Card, CustomBadge, PageTitle } from "@/components/admin/bits";
import { PrintButton, Submit } from "@/components/admin/ui";
import { hasRole, requirePage } from "@/lib/auth/session";
import { depositOf, quoteLink } from "@/lib/custom";
import { getDb, schema as s } from "@/lib/db";
import { formatDate, formatDateTime, formatTime, money } from "@/lib/format";
import { getSetting } from "@/lib/settings";
import { customAct } from "../../../actions";

export const metadata = { title: "Commande personnalisée" };

export default async function CustomPage({ params }: { params: { id: string } }) {
  const user = await requirePage("STAFF");
  if (!/^[0-9a-f-]{36}$/.test(params.id)) notFound();
  const db = await getDb();
  const [c] = await db.select().from(s.customOrders).where(eq(s.customOrders.id, params.id));
  if (!c) notFound();
  const [pays, notes, payments] = await Promise.all([
    db.select().from(s.payments).where(eq(s.payments.customOrderId, c.id)).orderBy(desc(s.payments.createdAt)),
    db.select().from(s.notifications).where(eq(s.notifications.customOrderId, c.id)).orderBy(desc(s.notifications.createdAt)),
    getSetting("payments"),
  ]);
  const paid = pays.filter((p) => p.status === "succeeded").reduce((t, p) => t + p.amountCents, 0);
  const back = "/admin/sur-mesure/" + c.id;
  const closed = c.status === "refused" || c.status === "cancelled";
  const act = (action: string, label: string, cls = "abtn", confirm?: string) => (
    <form action={customAct}>
      <input type="hidden" name="id" value={c.id} />
      <input type="hidden" name="action" value={action} />
      <input type="hidden" name="back" value={back} />
      <Submit className={cls} confirm={confirm}>{label}</Submit>
    </form>
  );

  return (
    <>
      <PageTitle title={`${c.occasion} — ${c.firstName} ${c.lastName}`} sub={<>{c.number} · reçue le {formatDateTime(c.createdAt)} · <Link href="/admin/sur-mesure" className="alink">toutes les demandes</Link></>}>
        <CustomBadge status={c.status} />
        <PrintButton />
      </PageTitle>
      <div className="agrid">
        <div className="astack agrid-wide">
          <Card title="La demande">
            <dl className="adl">
              <div><dt>Occasion</dt><dd>{c.occasion}</dd></div>
              <div><dt>Personnes</dt><dd>{c.servings}</dd></div>
              <div><dt>Gâteau</dt><dd>{c.cakeType}</dd></div>
              <div><dt>Saveurs</dt><dd>{c.flavors.join(" / ")}</dd></div>
              <div><dt>Message</dt><dd>{c.message ? `« ${c.message} »` : "—"}</dd></div>
              <div><dt>Date</dt><dd className="strong">{formatDate(c.desiredDate)}{c.desiredTime && " à " + formatTime(c.desiredTime)}</dd></div>
              <div><dt>Commentaire</dt><dd>{c.comment ?? "—"}</dd></div>
              <div><dt>Mode</dt><dd>{c.mode === "pay" ? "Payer maintenant" : "Demande de devis"}</dd></div>
              <div><dt>Estimation</dt><dd>{c.estimateCents !== null ? money(c.estimateCents) : "—"}</dd></div>
              {c.quoteCents !== null && <div><dt>Prix retenu</dt><dd className="strong">{money(c.quoteCents)}{c.depositPercent !== null && ` — acompte ${c.depositPercent} % (${money(depositOf(c))})`}</dd></div>}
              <div><dt>Déjà payé</dt><dd>{money(paid)}</dd></div>
            </dl>
          </Card>
          {c.inspirationImage && (
            <Card title="Photo d’inspiration">
              <a href={"/api/files?ref=" + encodeURIComponent(c.inspirationImage)} target="_blank" rel="noopener">
                <img src={"/api/files?ref=" + encodeURIComponent(c.inspirationImage)} alt="Photo d’inspiration envoyée par le client" className="apreview apreview--lg" />
              </a>
            </Card>
          )}
          {!closed && (
            <Card title="Actions" className="noprint">
              <div className="abtns">
                {c.status !== "accepted" && act("accept", "Accepter", "abtn abtn--ok", "Accepter la commande ? Le client est prévenu par email et la commande entre au planning.")}
                {act("cancel", "Annuler", "abtn abtn--danger", "Annuler cette commande personnalisée ?")}
              </div>
              <form action={customAct} className="aform">
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="back" value={back} />
                <label className="afield"><span>Message au client (utilisé pour « Demander modification », « Refuser » ou le devis)</span><textarea name="message" rows={3} maxLength={1500} defaultValue={c.adminMessage ?? ""} /></label>
                <div className="abtns">
                  <Submit className="abtn abtn--ghost" name="action" value="changes">Demander modification</Submit>
                  <Submit className="abtn abtn--ghost" name="action" value="refuse" confirm="Refuser la demande ? Le client est prévenu par email.">Refuser</Submit>
                </div>
              </form>
              {hasRole(user, "ADMIN") && (
                <form action={customAct} className="aform aform--inline">
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="action" value="quote" />
                  <input type="hidden" name="back" value={back} />
                  <label className="afield"><span>Montant du devis (€)</span><input name="quote" inputMode="decimal" required defaultValue={c.quoteCents ? (c.quoteCents / 100).toFixed(2).replace(".", ",") : c.estimateCents ? (c.estimateCents / 100).toFixed(2).replace(".", ",") : ""} /></label>
                  <label className="afield"><span>Acompte</span>
                    <select name="deposit" defaultValue={String(c.depositPercent ?? payments.depositPercent)}>
                      {[0, 30, 50, 100].map((v) => <option key={v} value={v}>{v === 0 ? "Aucun" : v + " %"}</option>)}
                    </select>
                  </label>
                  <label className="afield"><span>Message</span><input name="message" maxLength={1500} placeholder="Détail du devis, décor…" /></label>
                  <Submit>Envoyer le devis</Submit>
                </form>
              )}
              {c.status === "quote_sent" && <p className="amuted">Lien de devis envoyé au client : <a className="alink" href={quoteLink(c)} target="_blank" rel="noopener">{quoteLink(c).replace(/t=.*/, "t=…")}</a></p>}
            </Card>
          )}
        </div>
        <div className="astack">
          <Card title="Client">
            <p className="abig">{c.firstName} {c.lastName}</p>
            <p><a href={"tel:" + c.phone} className="alink">{c.phone}</a><br /><a href={"mailto:" + c.email} className="alink">{c.email}</a></p>
            <div className="abtns">
              <a href={"tel:" + c.phone} className="abtn abtn--ghost abtn--sm">Appeler</a>
              <a href={"mailto:" + c.email} className="abtn abtn--ghost abtn--sm">Email</a>
            </div>
            {c.customerId && <Link href={"/admin/clients/" + c.customerId} className="alink">Fiche client →</Link>}
          </Card>
          {c.orderId && (
            <Card title="Commande liée">
              <Link href={"/admin/commandes/" + c.orderId} className="abtn">Ouvrir la commande de retrait</Link>
            </Card>
          )}
          <Card title="Historique">
            <ul className="alist">
              {pays.map((p) => <li key={p.id}>{formatDateTime(p.createdAt)} — paiement {money(p.amountCents)} — {p.status}</li>)}
              {notes.map((n) => <li key={n.id}>{formatDateTime(n.createdAt)} — {n.channel} — {n.subject ?? n.type} — {n.status}</li>)}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}

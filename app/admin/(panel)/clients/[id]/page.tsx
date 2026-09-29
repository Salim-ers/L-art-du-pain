import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CustomBadge, Empty, Kpi, PageTitle, PayBadge, StatusBadge } from "@/components/admin/bits";
import { Submit } from "@/components/admin/ui";
import { getCustomer } from "@/lib/admin";
import { hasRole, requirePage } from "@/lib/auth/session";
import { formatDate, formatDateTime, money } from "@/lib/format";
import { addCustomerNote, deleteCustomerNote } from "../../../actions";

export const metadata = { title: "Fiche client" };

export default async function ClientPage({ params }: { params: { id: string } }) {
  const user = await requirePage("STAFF");
  if (!/^[0-9a-f-]{36}$/.test(params.id)) notFound();
  const data = await getCustomer(params.id);
  if (!data) notFound();
  const { customer: c, orders, customs, notes, count, total, last } = data;
  const back = "/admin/clients/" + c.id;
  return (
    <>
      <PageTitle title={`${c.firstName} ${c.lastName}`} sub={`Client depuis ${new Date(c.createdAt).getFullYear()}`}>
        <a href={"tel:" + c.phone} className="abtn">Appeler</a>
        <a href={"mailto:" + c.email} className="abtn abtn--ghost">Email</a>
      </PageTitle>
      <div className="akpis">
        <Kpi label="Commandes" value={count} />
        <Kpi label="Total dépensé" value={money(total)} />
        <Kpi label="Panier moyen" value={count ? money(Math.round(total / count)) : "—"} />
        <Kpi label="Dernière commande" value={last ? formatDate(new Date(last).toISOString().slice(0, 10), "short") : "—"} />
      </div>
      <div className="agrid">
        <div className="astack agrid-wide">
          <Card title="Historique des commandes">
            {orders.length ? (
              <table className="atable">
                <thead><tr><th>N°</th><th>Passée le</th><th>Retrait</th><th className="num">Montant</th><th>Paiement</th><th>Statut</th></tr></thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td><Link href={"/admin/commandes/" + o.id} className="alink strong">{o.number}</Link></td>
                      <td>{formatDateTime(o.createdAt)}</td>
                      <td>{formatDate(o.pickupDate, "short")} {o.pickupTime}</td>
                      <td className="num">{money(o.totalCents)}</td>
                      <td><PayBadge status={o.paymentStatus} /></td>
                      <td><StatusBadge status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <Empty>Aucune commande.</Empty>
            )}
          </Card>
          {customs.length > 0 && (
            <Card title="Commandes personnalisées">
              <ul className="alist">
                {customs.map((x) => (
                  <li key={x.id} className="alist-row">
                    <Link href={"/admin/sur-mesure/" + x.id} className="alink">{x.number} — {x.occasion}, {x.servings} pers., le {formatDate(x.desiredDate, "short")}</Link>
                    <CustomBadge status={x.status} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
        <div className="astack">
          <Card title="Coordonnées">
            <p><a href={"tel:" + c.phone} className="alink">{c.phone}</a><br /><a href={"mailto:" + c.email} className="alink">{c.email}</a></p>
          </Card>
          <Card title="Notes internes">
            <form action={addCustomerNote} className="aform">
              <input type="hidden" name="customerId" value={c.id} />
              <input type="hidden" name="back" value={back} />
              <textarea name="body" rows={3} required maxLength={2000} placeholder="Allergie, préférence, habitude…" aria-label="Nouvelle note" />
              <Submit>Ajouter la note</Submit>
            </form>
            <ul className="anotes-list">
              {notes.map(({ n, author }) => (
                <li key={n.id}>
                  <p>{n.body}</p>
                  <small>{author ?? "—"} · {formatDateTime(n.createdAt)}</small>
                  {hasRole(user, "ADMIN") && (
                    <form action={deleteCustomerNote}>
                      <input type="hidden" name="id" value={n.id} />
                      <input type="hidden" name="back" value={back} />
                      <Submit className="alink" confirm="Supprimer cette note ?">Supprimer</Submit>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}

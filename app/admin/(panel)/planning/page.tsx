import Link from "next/link";
import { asc, gte } from "drizzle-orm";
import { Card, Empty, PageTitle, StatusBadge } from "@/components/admin/bits";
import { PrintButton, Submit } from "@/components/admin/ui";
import { production } from "@/lib/admin";
import { addDays, isIsoDate, today } from "@/lib/dates";
import { getDb, schema as s } from "@/lib/db";
import { formatDate, formatTime } from "@/lib/format";
import { customStatusLabel } from "@/lib/labels";
import { addClosure, removeClosure } from "../../actions";

export const metadata = { title: "Planning de production" };

export default async function PlanningPage({ searchParams }: { searchParams: { date?: string } }) {
  const d = searchParams.date && isIsoDate(searchParams.date) ? searchParams.date : today();
  const { groups, custom, orders } = await production(d);
  const db = await getDb();
  const overrides = await db.select().from(s.pickupSlots).where(gte(s.pickupSlots.date, today())).orderBy(asc(s.pickupSlots.date), asc(s.pickupSlots.time));
  const total = groups.reduce((t, [, rows]) => t + rows.reduce((a, r) => a + r.qty, 0), 0);
  const back = "/admin/planning?date=" + d;

  return (
    <>
      <PageTitle title={`Production — ${formatDate(d)}`} sub={`${orders.length} commande(s) à retirer · ${total} pièce(s) · ${custom.length} gâteau(x) personnalisé(s)`}>
        <div className="aday-nav noprint">
          <Link href={"/admin/planning?date=" + addDays(d, -1)} className="abtn abtn--ghost">←</Link>
          <form action="/admin/planning"><input type="date" name="date" defaultValue={d} aria-label="Date" /><button className="abtn abtn--ghost" type="submit">Aller</button></form>
          <Link href={"/admin/planning?date=" + addDays(d, 1)} className="abtn abtn--ghost">→</Link>
        </div>
        <PrintButton label="Imprimer la feuille" />
      </PageTitle>

      <div className="aprod">
        {groups.length ? (
          groups.map(([cat, rows]) => (
            <section key={cat} className="aprod-group">
              <h2>{cat}</h2>
              <ul>
                {rows.map((r) => (
                  <li key={r.name + (r.variant ?? "")}>
                    <span>{r.name}{r.variant && <em> {r.variant}</em>}</span>
                    <strong>× {r.qty}</strong>
                  </li>
                ))}
              </ul>
            </section>
          ))
        ) : (
          <Empty>Aucune production Click & Collect prévue ce jour-là.</Empty>
        )}
        {custom.length > 0 && (
          <section className="aprod-group">
            <h2>Gâteaux personnalisés — {custom.length} commande(s)</h2>
            <ul>
              {custom.map((c) => (
                <li key={c.id}>
                  <span>
                    <Link href={"/admin/sur-mesure/" + c.id} className="alink">{c.desiredTime ? formatTime(c.desiredTime) + " — " : ""}{c.cakeType} {c.servings} pers. · {c.flavors.join(" / ")}</Link>
                    {c.message && <em> « {c.message} »</em>}
                  </span>
                  <strong>{customStatusLabel[c.status]}</strong>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <Card title="Retraits du jour" className="aprint-break">
        {orders.length ? (
          <table className="atable">
            <thead><tr><th>Heure</th><th>N°</th><th>Client</th><th>Contenu</th><th>Instructions</th><th>Statut</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="strong">{formatTime(o.pickupTime)}</td>
                  <td><Link href={"/admin/commandes/" + o.id} className="alink">{o.number}</Link></td>
                  <td>{o.lastName} {o.firstName}<br /><span className="amuted">{o.phone}</span></td>
                  <td className="atable-items">{o.items.map((i) => `${i.quantity} × ${i.name}${i.variantLabel ? " (" + i.variantLabel + ")" : ""}`).join(", ")}</td>
                  <td>{o.customerNote}</td>
                  <td><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty>Aucun retrait.</Empty>
        )}
      </Card>

      <Card title="Fermetures et capacité des créneaux" className="noprint">
        <p className="amuted">Fermez une journée entière (heure vide) ou un créneau précis, ou ajustez le nombre de commandes par créneau (capacité). Les clients ne pourront plus réserver un créneau fermé ou complet.</p>
        <form action={addClosure} className="aform aform--inline">
          <input type="hidden" name="back" value={back} />
          <label className="afield"><span>Date</span><input type="date" name="date" defaultValue={d} required /></label>
          <label className="afield"><span>Heure (facultatif)</span><input type="time" name="time" step={300} /></label>
          <label className="afield"><span>Capacité (vide = fermé)</span><input type="number" name="capacity" min={0} max={200} /></label>
          <label className="afield"><span>Note</span><input name="note" placeholder="Congés, inventaire…" maxLength={120} /></label>
          <Submit>Ajouter</Submit>
        </form>
        {overrides.length > 0 && (
          <ul className="alist">
            {overrides.map((o) => (
              <li key={o.id} className="alist-row">
                <span>{formatDate(o.date)} {o.time ? "à " + formatTime(o.time) : "(journée)"} — {o.closed ? "fermé" : `capacité ${o.capacity}`}{o.note ? ` — ${o.note}` : ""}</span>
                <form action={removeClosure}>
                  <input type="hidden" name="id" value={o.id} />
                  <input type="hidden" name="back" value={back} />
                  <Submit className="abtn abtn--ghost abtn--sm">Supprimer</Submit>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

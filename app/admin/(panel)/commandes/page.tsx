import Link from "next/link";
import { Empty, PageTitle, PayBadge, StatusBadge } from "@/components/admin/bits";
import { Submit } from "@/components/admin/ui";
import { listOrders } from "@/lib/admin";
import { formatDate, formatTime, money } from "@/lib/format";
import { orderStatusLabel } from "@/lib/labels";
import type { OrderStatus } from "@/lib/db/schema";
import { orderStatus } from "../../actions";

export const metadata = { title: "Commandes" };

type SP = { q?: string; status?: string; date?: string; scope?: string; page?: string; attente?: string };

// Action suivante la plus probable, en un clic.
const nextStep: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  new: { to: "confirmed", label: "Confirmer" },
  confirmed: { to: "in_preparation", label: "Préparer" },
  to_prepare: { to: "in_preparation", label: "Préparer" },
  in_preparation: { to: "ready", label: "Prête" },
  ready: { to: "collected", label: "Retirée" },
};

export default async function OrdersPage({ searchParams: sp }: { searchParams: SP }) {
  const { rows, more, page } = await listOrders({
    q: sp.q,
    status: sp.status,
    date: sp.date,
    scope: sp.scope === "created" ? "created" : "pickup",
    pending: sp.attente === "1",
    page: Number(sp.page) || 1,
  });
  const qs = (patch: Partial<SP>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    return "/admin/commandes?" + p.toString();
  };
  const back = qs({});

  return (
    <>
      <PageTitle title="Commandes" sub={sp.date ? `${sp.scope === "created" ? "Passées le" : "Retrait le"} ${formatDate(sp.date)}` : "Toutes les commandes"}>
        <Link href={qs({ attente: sp.attente === "1" ? "" : "1", page: "" })} className="abtn abtn--ghost">
          {sp.attente === "1" ? "← Commandes confirmées" : "Paiements non aboutis"}
        </Link>
      </PageTitle>

      <form className="afilters" action="/admin/commandes">
        <input name="q" defaultValue={sp.q} placeholder="N°, nom, téléphone, email…" aria-label="Rechercher" />
        <select name="status" defaultValue={sp.status ?? ""} aria-label="Statut">
          <option value="">Tous les statuts</option>
          <option value="open">En cours (non retirées)</option>
          {Object.entries(orderStatusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input type="date" name="date" defaultValue={sp.date} aria-label="Date de retrait" />
        <select name="scope" defaultValue={sp.scope ?? "pickup"} aria-label="Type de date">
          <option value="pickup">Date de retrait</option>
          <option value="created">Date de commande</option>
        </select>
        {sp.attente && <input type="hidden" name="attente" value={sp.attente} />}
        <button className="abtn" type="submit">Filtrer</button>
        <Link href="/admin/commandes" className="alink">Réinitialiser</Link>
      </form>

      {rows.length ? (
        <div className="atable-wrap">
          <table className="atable">
            <thead>
              <tr>
                <th>Numéro</th><th>Client</th><th>Téléphone</th><th>Commande</th><th className="num">Montant</th><th>Paiement</th><th>Date</th><th>Heure</th><th>Statut</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => {
                const step = nextStep[o.status];
                return (
                  <tr key={o.id}>
                    <td><Link href={"/admin/commandes/" + o.id} className="alink strong">{o.number}</Link>{o.kind === "custom" && <span className="atag">sur mesure</span>}</td>
                    <td>{o.lastName} {o.firstName}</td>
                    <td><a href={"tel:" + o.phone} className="alink">{o.phone}</a></td>
                    <td className="atable-items">{o.items.map((i) => `${i.quantity} × ${i.name}${i.variantLabel ? " (" + i.variantLabel + ")" : ""}`).join(", ")}</td>
                    <td className="num">{money(o.totalCents)}</td>
                    <td><PayBadge status={o.paymentStatus} /></td>
                    <td>{formatDate(o.pickupDate, "short")}</td>
                    <td>{formatTime(o.pickupTime)}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td>
                      <div className="arow-actions">
                        {step && (
                          <form action={orderStatus}>
                            <input type="hidden" name="id" value={o.id} />
                            <input type="hidden" name="status" value={step.to} />
                            <input type="hidden" name="back" value={back} />
                            <Submit className="abtn abtn--sm">{step.label}</Submit>
                          </form>
                        )}
                        <Link href={"/admin/commandes/" + o.id} className="abtn abtn--ghost abtn--sm">Ouvrir</Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>Aucune commande ne correspond.</Empty>
      )}
      <div className="apager">
        {page > 1 && <Link href={qs({ page: String(page - 1) })} className="abtn abtn--ghost">← Précédentes</Link>}
        {more && <Link href={qs({ page: String(page + 1) })} className="abtn abtn--ghost">Suivantes →</Link>}
      </div>
    </>
  );
}

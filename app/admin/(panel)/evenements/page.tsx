import Link from "next/link";
import { Card, Empty, PageTitle } from "@/components/admin/bits";
import { Submit } from "@/components/admin/ui";
import { requirePage } from "@/lib/auth/session";
import { listCampaigns } from "@/lib/catalog";
import { campaignStateLabel } from "@/lib/events";
import { eventTemplates } from "@/lib/event-templates";
import { formatDate } from "@/lib/format";
import { createEventFromTemplate, toggleEvent } from "../../actions";

export const metadata = { title: "Événements" };

const B = "/admin/evenements";

export default async function EventsAdmin() {
  await requirePage("ADMIN");
  const rows = await listCampaigns();
  const existing = new Set(rows.map((r) => r.kind));
  return (
    <>
      <PageTitle title="Événements" sub="Noël, Épiphanie, Ramadan, les deux Aïd, Pâques… Chaque événement a sa page, ses produits, ses dates de précommande et de retrait. Activez-le quand il est prêt.">
        <Link href="/admin/evenements/nouveau" className="abtn">+ Événement personnalisé</Link>
      </PageTitle>
      <div className="astack">
        {rows.length ? (
          <div className="atable-wrap">
            <table className="atable">
              <thead><tr><th>Événement</th><th>Sur le site</th><th>État</th><th>Précommandes</th><th>Retraits</th><th className="num">Commandes</th><th>Page</th></tr></thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id}>
                    <td><Link href={"/admin/evenements/" + e.id} className="alink strong">{e.name}</Link>{e.isDemo && <span className="atag">exemple</span>}</td>
                    <td>
                      <form action={toggleEvent}>
                        <input type="hidden" name="id" value={e.id} />
                        <input type="hidden" name="back" value={B} />
                        <Submit className={e.published ? "abtn abtn--sm abtn--ok" : "abtn abtn--sm abtn--ghost"}>{e.published ? "Activé" : "Désactivé"}</Submit>
                      </form>
                    </td>
                    <td><span className={"abadge abadge--camp-" + e.state}>{campaignStateLabel[e.state]}</span></td>
                    <td>{e.orderOpensAt ? new Date(e.orderOpensAt).toLocaleDateString("fr-FR") : "—"} → {e.orderClosesAt ? new Date(e.orderClosesAt).toLocaleDateString("fr-FR") : "—"}</td>
                    <td>{e.dates.length ? `${formatDate(e.dates[0], "short")} → ${formatDate(e.dates[e.dates.length - 1], "short")} (${e.dates.length} j)` : "—"}</td>
                    <td className="num">{e.orderCount}{e.maxOrders !== null && ` / ${e.maxOrders}`}</td>
                    <td><Link href={e.kind === "noel" ? "/noel" : "/evenements/" + e.slug} target="_blank" className="alink">Voir ↗</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>Aucun événement pour le moment.</Empty>
        )}

        <Card title="Ajouter un événement">
          <p className="amuted">Un clic crée l’événement en brouillon (désactivé) : vous ajoutez ensuite les produits, les dates et une photo, puis vous l’activez.</p>
          <div className="abtns">
            {eventTemplates.map((t) => (
              <form key={t.kind} action={createEventFromTemplate}>
                <input type="hidden" name="kind" value={t.kind} />
                <input type="hidden" name="back" value={B} />
                <Submit className="abtn abtn--ghost">{existing.has(t.kind) ? "+ " : ""}{t.label}</Submit>
              </form>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

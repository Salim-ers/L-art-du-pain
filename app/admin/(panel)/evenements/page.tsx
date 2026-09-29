import Link from "next/link";
import { Empty, PageTitle } from "@/components/admin/bits";
import { requirePage } from "@/lib/auth/session";
import { listCampaigns } from "@/lib/catalog";
import { campaignStateLabel } from "@/lib/events";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Événements" };

export default async function EventsAdmin() {
  await requirePage("ADMIN");
  const rows = await listCampaigns();
  return (
    <>
      <PageTitle title="Événements & campagnes" sub="Noël, Épiphanie, Pâques, Saint-Valentin, Ramadan, fêtes… : une campagne = une page, des produits, des dates de retrait et un quota.">
        <Link href="/admin/evenements/nouveau" className="abtn">+ Nouvelle campagne</Link>
      </PageTitle>
      {rows.length ? (
        <div className="atable-wrap">
          <table className="atable">
            <thead><tr><th>Campagne</th><th>État</th><th>Précommandes</th><th>Retraits</th><th className="num">Commandes</th><th>Page</th></tr></thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id}>
                  <td><Link href={"/admin/evenements/" + e.id} className="alink strong">{e.name}</Link></td>
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
        <Empty>Aucune campagne.</Empty>
      )}
    </>
  );
}

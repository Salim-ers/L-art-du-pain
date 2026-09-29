import Link from "next/link";
import { Empty, PageTitle } from "@/components/admin/bits";
import { listCustomers } from "@/lib/admin";
import { formatDateTime, money } from "@/lib/format";

export const metadata = { title: "Clients" };

export default async function ClientsPage({ searchParams }: { searchParams: { q?: string } }) {
  const rows = await listCustomers(searchParams.q);
  return (
    <>
      <PageTitle title="Clients" sub={`${rows.length} client(s)${searchParams.q ? " trouvés" : ""}`} />
      <form className="afilters" action="/admin/clients">
        <input name="q" defaultValue={searchParams.q} placeholder="Nom, email, téléphone…" aria-label="Rechercher un client" />
        <button className="abtn" type="submit">Rechercher</button>
      </form>
      {rows.length ? (
        <div className="atable-wrap">
          <table className="atable">
            <thead><tr><th>Client</th><th>Téléphone</th><th>Email</th><th className="num">Commandes</th><th className="num">Total</th><th>Dernière commande</th></tr></thead>
            <tbody>
              {rows.map(({ c, n, total, last }) => (
                <tr key={c.id}>
                  <td><Link href={"/admin/clients/" + c.id} className="alink strong">{c.lastName} {c.firstName}</Link></td>
                  <td><a href={"tel:" + c.phone} className="alink">{c.phone}</a></td>
                  <td>{c.email}</td>
                  <td className="num">{n}</td>
                  <td className="num">{money(total)}</td>
                  <td>{last ? formatDateTime(last) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>Aucun client.</Empty>
      )}
    </>
  );
}

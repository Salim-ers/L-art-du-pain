import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { CustomBadge, Empty, PageTitle } from "@/components/admin/bits";
import { getDb, schema as s } from "@/lib/db";
import { formatDate, formatDateTime, formatTime, money } from "@/lib/format";
import { customStatusLabel } from "@/lib/labels";
import type { CustomStatus } from "@/lib/db/schema";

export const metadata = { title: "Commandes personnalisées" };

export default async function CustomListPage({ searchParams }: { searchParams: { status?: string } }) {
  const db = await getDb();
  const status = Object.keys(customStatusLabel).find((k) => k === searchParams.status) as CustomStatus | undefined;
  const rows = await db
    .select()
    .from(s.customOrders)
    .where(status ? eq(s.customOrders.status, status) : undefined)
    .orderBy(desc(s.customOrders.createdAt))
    .limit(200);
  return (
    <>
      <PageTitle title="Commandes personnalisées" sub="Gâteaux sur mesure : validation, devis, acomptes." />
      <nav className="asegs" aria-label="Filtrer par statut">
        <Link href="/admin/sur-mesure" aria-current={!status ? "page" : undefined}>Toutes</Link>
        {Object.entries(customStatusLabel).map(([k, v]) => (
          <Link key={k} href={"/admin/sur-mesure?status=" + k} aria-current={status === k ? "page" : undefined}>{v}</Link>
        ))}
      </nav>
      {rows.length ? (
        <ul className="acustoms">
          {rows.map((c) => (
            <li key={c.id}>
              <Link href={"/admin/sur-mesure/" + c.id} className="acustom">
                <span className="acustom-main">
                  <strong>{c.occasion} — {c.firstName} {c.lastName}</strong>
                  <span>{c.servings} personnes · {c.cakeType} · {c.flavors.join(" / ")}</span>
                  {c.message && <em>« {c.message} »</em>}
                </span>
                <span className="acustom-side">
                  <span>{formatDate(c.desiredDate)}{c.desiredTime && " · " + formatTime(c.desiredTime)}</span>
                  <span className="amuted">{c.mode === "pay" ? "Payer maintenant" : "Devis"} · {money(c.quoteCents ?? c.estimateCents ?? 0)}</span>
                  <CustomBadge status={c.status} />
                  <small className="amuted">{c.number} · reçue {formatDateTime(c.createdAt)}</small>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Aucune demande.</Empty>
      )}
    </>
  );
}

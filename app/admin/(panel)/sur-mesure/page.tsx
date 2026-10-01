import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { CustomBadge, Empty, PageTitle } from "@/components/admin/bits";
import { getDb, schema as s } from "@/lib/db";
import { formatDate, formatDateTime, formatTime, money } from "@/lib/format";
import { customStatusLabel } from "@/lib/labels";
import type { CustomStatus } from "@/lib/db/schema";

export const metadata = { title: "Commandes personnalisées" };

export default async function CustomListPage({ searchParams }: { searchParams: { status?: string; type?: string } }) {
  const db = await getDb();
  const status = Object.keys(customStatusLabel).find((k) => k === searchParams.status) as CustomStatus | undefined;
  const kind = searchParams.type === "cake" || searchParams.type === "special" ? searchParams.type : undefined;
  const rows = await db
    .select()
    .from(s.customOrders)
    .where(and(status ? eq(s.customOrders.status, status) : undefined, kind ? eq(s.customOrders.kind, kind) : undefined))
    .orderBy(desc(s.customOrders.createdAt))
    .limit(200);
  return (
    <>
      <PageTitle title="Commandes personnalisées" sub="Gâteaux sur mesure et commandes particulières : accepter, refuser, demander des précisions ou envoyer un devis." />
      <nav className="asegs" aria-label="Filtrer par type">
        <Link href="/admin/sur-mesure" aria-current={!kind ? "page" : undefined}>Tout</Link>
        <Link href="/admin/sur-mesure?type=cake" aria-current={kind === "cake" ? "page" : undefined}>Gâteaux</Link>
        <Link href="/admin/sur-mesure?type=special" aria-current={kind === "special" ? "page" : undefined}>Commandes particulières</Link>
      </nav>
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
                  <strong>{c.kind === "special" ? "Particulière · " : ""}{c.occasion} — {c.firstName} {c.lastName}</strong>
                  <span>{c.kind === "special" ? `${c.servings}${c.comment ? " · " + c.comment.slice(0, 90) : ""}` : `${c.servings} personnes · ${c.cakeType} · ${c.flavors.join(" / ")}`}</span>
                  {c.message && <em>« {c.message} »</em>}
                </span>
                <span className="acustom-side">
                  <span>{formatDate(c.desiredDate)}{c.desiredTime && " · " + formatTime(c.desiredTime)}</span>
                  <span className="amuted">{c.mode === "pay" ? "Payer maintenant" : "Devis"}{c.quoteCents ?? c.estimateCents ? " · " + money(c.quoteCents ?? c.estimateCents ?? 0) : ""}</span>
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

import Link from "next/link";
import { Card, Empty, Kpi, PageTitle, PayBadge, StatusBadge } from "@/components/admin/bits";
import { Submit } from "@/components/admin/ui";
import { todayStats, unreadNotifications, upcomingPickups } from "@/lib/admin";
import { formatDate, formatDateTime, formatTime, money } from "@/lib/format";
import { releaseExpiredPayments } from "@/lib/orders";
import { today } from "@/lib/dates";
import { markNotificationsRead } from "../actions";

export const metadata = { title: "Tableau de bord" };

export default async function Dashboard({ searchParams }: { searchParams: { interdit?: string } }) {
  // Le nettoyage des paiements abandonnés part en parallèle : il ne retarde plus l'affichage.
  const [t, next, notes] = await Promise.all([todayStats(), upcomingPickups(14), unreadNotifications(), releaseExpiredPayments()]);
  const d = today();
  return (
    <>
      <PageTitle title="Aujourd’hui" sub={formatDate(d)}>
        <Link href={`/admin/planning?date=${d}`} className="abtn">Feuille de production</Link>
        <Link href="/admin/commandes?status=open" className="abtn abtn--ghost">Commandes en cours</Link>
      </PageTitle>
      {searchParams.interdit && <p className="aerr">Cette section est réservée aux administrateurs.</p>}

      <div className="akpis">
        <Kpi label="Commandes aujourd’hui" value={t.orders} href={`/admin/commandes?date=${d}&scope=created`} />
        <Kpi label="CA aujourd’hui" value={money(t.revenue)} />
        <Kpi label="À préparer" value={t.toPrepare} tone="warn" href={`/admin/commandes?date=${d}&status=open`} />
        <Kpi label="En préparation" value={t.inPreparation} tone="info" href={`/admin/commandes?date=${d}&status=in_preparation`} />
        <Kpi label="Prêtes" value={t.ready} tone="ok" href={`/admin/commandes?date=${d}&status=ready`} />
        <Kpi label="Retirées" value={t.collected} tone="muted" href={`/admin/commandes?date=${d}&status=collected`} />
      </div>

      <div className="agrid">
        <Card title="Prochains retraits" action={<Link href="/admin/commandes?status=open" className="alink">Tout voir →</Link>} className="agrid-wide">
          {next.length ? (
            <ul className="apickups">
              {next.map((o) => (
                <li key={o.id}>
                  <Link href={"/admin/commandes/" + o.id} className="apickup">
                    <span className="apickup-time">
                      {o.pickupDate !== d && <small>{formatDate(o.pickupDate, "day")}</small>}
                      {formatTime(o.pickupTime)}
                    </span>
                    <span className="apickup-who">
                      <strong>{o.lastName}</strong> {o.firstName}
                      <small>{o.items.map((i) => `${i.quantity} × ${i.name}${i.variantLabel ? " (" + i.variantLabel + ")" : ""}`).join(", ")}</small>
                    </span>
                    <span className="apickup-tags">
                      <StatusBadge status={o.status} />
                      <PayBadge status={o.paymentStatus} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Aucun retrait prévu pour le moment.</Empty>
          )}
        </Card>

        <div className="astack">
          <Card
            title="Notifications"
            action={
              notes.length ? (
                <form action={markNotificationsRead}>
                  <input type="hidden" name="back" value="/admin" />
                  <Submit className="alink">Tout marquer lu</Submit>
                </form>
              ) : undefined
            }
          >
            {notes.length ? (
              <ul className="anotes">
                {notes.map((n) => (
                  <li key={n.id}>
                    <Link href={n.customOrderId ? "/admin/sur-mesure/" + n.customOrderId : n.orderId ? "/admin/commandes/" + n.orderId : "/admin/messages"}>
                      <strong>{n.subject}</strong>
                      <span>{n.body}</span>
                      <small>{formatDateTime(n.createdAt)}</small>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>Rien de nouveau.</Empty>
            )}
          </Card>
          <Card title="À traiter">
            <ul className="atodo">
              <li><Link href="/admin/sur-mesure?status=pending">Commandes personnalisées à valider <b>{t.customPending}</b></Link></li>
              <li><Link href="/admin/messages">Messages non lus <b>{t.unreadMessages}</b></Link></li>
              <li><Link href={`/admin/commandes?date=${d}`}>Retraits du jour <b>{t.pickupsToday}</b></Link></li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}

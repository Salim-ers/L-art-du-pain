import type { ReactNode } from "react";
import { and, eq, sql } from "drizzle-orm";
import { AutoRefresh, Flash, Sidebar } from "@/components/admin/ui";
import { hasRole, requirePage } from "@/lib/auth/session";
import { getDb, schema as s } from "@/lib/db";
import { logout } from "../actions";

export const dynamic = "force-dynamic";

const roleLabel = { SUPER_ADMIN: "Super administrateur", ADMIN: "Administrateur", STAFF: "Équipe" };

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const user = await requirePage("STAFF");
  const db = await getDb();
  const [[custom], [msgs], [notes]] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(s.customOrders).where(eq(s.customOrders.status, "pending")),
    db.select({ n: sql<number>`count(*)::int` }).from(s.messages).where(eq(s.messages.read, false)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(s.notifications)
      .where(and(eq(s.notifications.audience, "staff"), eq(s.notifications.channel, "dashboard"), sql`${s.notifications.readAt} is null`)),
  ]);
  const admin = hasRole(user, "ADMIN");
  const items = [
    { href: "/admin", label: "Tableau de bord", badge: notes.n },
    { href: "/admin/commandes", label: "Commandes" },
    { href: "/admin/planning", label: "Planning" },
    { href: "/admin/clients", label: "Clients" },
    ...(admin ? [{ href: "/admin/produits", label: "Produits" }, { href: "/admin/categories", label: "Catégories" }] : []),
    { href: "/admin/stock", label: "Stock" },
    { href: "/admin/sur-mesure", label: "Commandes personnalisées", badge: custom.n },
    ...(admin
      ? [
          { href: "/admin/evenements", label: "Événements" },
          { href: "/admin/noel", label: "Noël" },
          { href: "/admin/promotions", label: "Promotions" },
        ]
      : []),
    { href: "/admin/messages", label: "Messages", badge: msgs.n },
    ...(admin ? [{ href: "/admin/statistiques", label: "Statistiques" }, { href: "/admin/galerie", label: "Galerie" }] : []),
    { href: "/admin/parametres", label: "Paramètres" },
  ];
  return (
    <div className="adm">
      <Sidebar items={items} user={user.name} role={roleLabel[user.role]} />
      <div className="adm-main">
        <form action={logout} className="adm-logout">
          <button type="submit">Déconnexion</button>
        </form>
        <Flash />
        <AutoRefresh unread={notes.n} />
        {children}
      </div>
    </div>
  );
}

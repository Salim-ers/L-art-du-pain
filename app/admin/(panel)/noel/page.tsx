import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { requirePage } from "@/lib/auth/session";
import { getDb, schema as s } from "@/lib/db";

/** Raccourci : ouvre la campagne de Noël (la plus récente), ou en crée une. */
export default async function NoelAdmin() {
  await requirePage("ADMIN");
  const db = await getDb();
  const [e] = await db.select().from(s.events).where(eq(s.events.kind, "noel")).orderBy(desc(s.events.createdAt)).limit(1);
  redirect(e ? "/admin/evenements/" + e.id : "/admin/evenements/nouveau");
}

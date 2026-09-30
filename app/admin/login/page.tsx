import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { currentUser } from "@/lib/auth/session";
import { getDb, schema as s } from "@/lib/db";
import { adminEnv } from "@/lib/db/seed";
import { env } from "@/lib/env";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Connexion" };

type Check = { ok: boolean; label: string };

/** État de la configuration (jamais de valeur secrète affichée) — visible uniquement si un point bloque. */
async function diagnose(): Promise<Check[]> {
  const { email, password } = adminEnv();
  const checks: Check[] = [];
  if (!env.databaseUrl) {
    checks.push({ ok: false, label: "Base de données : aucune variable DATABASE_URL — connectez Neon (Vercel → Storage → Connect), puis redéployez." });
    return checks;
  }
  let dbOk = true;
  let found = false;
  try {
    const db = await getDb();
    if (email) found = !!(await db.select({ id: s.users.id }).from(s.users).where(eq(s.users.email, email)))[0];
  } catch (e) {
    dbOk = false;
    checks.push({ ok: false, label: "Base de données injoignable : " + (e instanceof Error ? e.message.slice(0, 160) : "erreur") });
  }
  if (dbOk) checks.push({ ok: true, label: "Base de données connectée" });
  checks.push({ ok: !!email, label: email ? "Variable ADMIN_EMAIL présente" : "Variable ADMIN_EMAIL absente" });
  checks.push({ ok: !!password, label: password ? "Variable ADMIN_PASSWORD présente" : "Variable ADMIN_PASSWORD absente" });
  if (dbOk && email) checks.push({ ok: found, label: found ? "Compte administrateur créé pour ADMIN_EMAIL" : "Aucun compte pour ADMIN_EMAIL — redéployez après avoir ajouté les variables" });
  return checks;
}

export default async function LoginPage() {
  if (await currentUser().catch(() => null)) redirect("/admin");
  const checks = env.isProd ? await diagnose() : [];
  const blocking = checks.some((c) => !c.ok);
  return (
    <main className="alogin">
      <div className="alogin-card">
        <p className="alogin-brand">L’Art du Pain</p>
        <h1>Espace de gestion</h1>
        {blocking && (
          <ul className="alogin-diag" aria-label="État de la configuration">
            {checks.map((c) => (
              <li key={c.label} data-ok={c.ok ? "" : undefined}>{c.ok ? "✓" : "✗"} {c.label}</li>
            ))}
          </ul>
        )}
        <LoginForm />
        {!env.isProd && !env.databaseUrl && (
          <p className="alogin-dev">Base locale de démonstration : admin@lartdupain.local / boulangerie-dev</p>
        )}
        {env.isProd && !blocking && (
          <p className="alogin-dev">Mot de passe oublié ? Ajoutez la variable ADMIN_RESET_PASSWORD = 1 dans Vercel, redéployez, connectez-vous avec ADMIN_PASSWORD, puis retirez la variable.</p>
        )}
      </div>
    </main>
  );
}

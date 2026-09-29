import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage() {
  if (await currentUser()) redirect("/admin");
  return (
    <main className="alogin">
      <div className="alogin-card">
        <p className="alogin-brand">L’Art du Pain</p>
        <h1>Espace de gestion</h1>
        <LoginForm />
        {!env.isProd && !env.databaseUrl && (
          <p className="alogin-dev">Base locale de démonstration : admin@lartdupain.local / boulangerie-dev</p>
        )}
      </div>
    </main>
  );
}

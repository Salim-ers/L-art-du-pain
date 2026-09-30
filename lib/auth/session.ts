import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema as s } from "@/lib/db";
import type { Role, User } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { SESSION_COOKIE, SESSION_HOURS, signSession, verifySession } from "./token";

const rank: Record<Role, number> = { STAFF: 1, ADMIN: 2, SUPER_ADMIN: 3 };
export const hasRole = (user: Pick<User, "role">, min: Role) => rank[user.role] >= rank[min];

export async function startSession(user: User) {
  const token = await signSession({ sub: user.id, role: user.role, v: user.tokenVersion });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
}

export function endSession() {
  cookies().delete(SESSION_COOKIE);
}

/**
 * Utilisateur courant, relu en base à chaque requête (compte désactivé ou sessions révoquées = déconnecté).
 * Mis en cache le temps d'un rendu : layout et page partagent la même lecture.
 */
export const currentUser = cache(async (): Promise<User | null> => {
  const claims = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  if (!claims) return null;
  const db = await getDb();
  const [u] = await db.select().from(s.users).where(eq(s.users.id, claims.sub));
  if (!u || !u.active || u.tokenVersion !== claims.v) return null;
  return u;
});

/** Pour les pages : redirige vers la connexion, ou vers le tableau de bord si le rôle est insuffisant. */
export async function requirePage(min: Role = "STAFF"): Promise<User> {
  const u = await currentUser();
  if (!u) redirect("/admin/login");
  if (!hasRole(u, min)) redirect("/admin?interdit=1");
  return u;
}

export class AuthError extends Error {}

/** Pour les Server Actions : lève une erreur (jamais de confiance accordée au client). */
export async function requireAction(min: Role = "STAFF"): Promise<User> {
  const u = await currentUser();
  if (!u) throw new AuthError("Session expirée. Merci de vous reconnecter.");
  if (!hasRole(u, min)) throw new AuthError("Action réservée à un administrateur.");
  return u;
}

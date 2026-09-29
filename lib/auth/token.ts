/** Jeton de session admin (JWT HS256 signé) — utilisable côté Edge (middleware) comme côté Node. */
import { SignJWT, jwtVerify } from "jose";
import { authSecret } from "@/lib/env";
import type { Role } from "@/lib/db/schema";

export const SESSION_COOKIE = "adp_admin";
export const SESSION_HOURS = 12;

export type SessionClaims = { sub: string; role: Role; v: number };

export async function signSession(c: SessionClaims) {
  return new SignJWT({ role: c.role, v: c.v })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(c.sub)
    .setIssuedAt()
    .setExpirationTime(SESSION_HOURS + "h")
    .setAudience("adp-admin")
    .sign(authSecret());
}

export async function verifySession(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, authSecret(), { audience: "adp-admin", algorithms: ["HS256"] });
    if (typeof payload.sub !== "string") return null;
    return { sub: payload.sub, role: payload.role as Role, v: Number(payload.v ?? 0) };
  } catch {
    return null;
  }
}

import "server-only";
import { headers } from "next/headers";
import { getDb, schema as s } from "@/lib/db";

/* ---------- Limitation de débit (mémoire du processus) ----------
   Suffisant pour une boutique ; pour plusieurs instances serverless, brancher un store partagé (Upstash Redis…). */
const hits = new Map<string, number[]>();

export function clientIp() {
  const h = headers();
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "local").trim();
}

/** true si la requête est autorisée. */
export function rateLimit(key: string, limit: number, windowSec: number) {
  const now = Date.now();
  const from = now - windowSec * 1000;
  const list = (hits.get(key) ?? []).filter((t) => t > from);
  if (list.length >= limit) {
    hits.set(key, list);
    return false;
  }
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => t > from)) hits.delete(k);
  return true;
}

export class RateLimitError extends Error {
  constructor() {
    super("Trop de tentatives. Merci de patienter quelques minutes.");
  }
}

export function limitOrThrow(scope: string, limit: number, windowSec: number) {
  if (!rateLimit(scope + ":" + clientIp(), limit, windowSec)) throw new RateLimitError();
}

/* ---------- Journal d'audit ---------- */
export async function audit(userId: string | null, action: string, entity?: string, entityId?: string, data?: unknown) {
  try {
    const db = await getDb();
    await db.insert(s.auditLogs).values({ userId, action, entity, entityId, data: data ?? null });
  } catch (e) {
    console.error("[audit]", e);
  }
}

export function logError(scope: string, e: unknown) {
  console.error(`[${scope}]`, e instanceof Error ? e.stack || e.message : e);
}

/** Jeton aléatoire non devinable (suivi de commande, paiement de devis). */
export function token(bytes = 24) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Buffer.from(a).toString("base64url");
}

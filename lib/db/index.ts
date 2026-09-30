/**
 * Accès base de données — côté serveur uniquement.
 * - DATABASE_URL (ou POSTGRES_URL) défini — Neon, ou tout PostgreSQL : connexion postgres-js.
 *   Les migrations et les données initiales sont appliquées automatiquement au premier démarrage.
 * - Sinon : PGlite, un vrai PostgreSQL embarqué. En local il est conservé dans `.data/pglite` ;
 *   sur Vercel il est temporaire (/tmp) : le site s'affiche, mais la commande en ligne reste fermée.
 */
import path from "node:path";
import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { env } from "@/lib/env";
import * as schema from "./schema";

export type DB = PostgresJsDatabase<typeof schema>;
export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];

const MIGRATIONS = path.join(process.cwd(), "drizzle");

type GlobalDb = { __adpDb?: Promise<DB> };
const g = globalThis as unknown as GlobalDb;

async function connectPostgres(url: string): Promise<DB> {
  const { default: postgres } = await import("postgres");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");

  // Migrations sur une connexion directe (hors pooler), sérialisées entre instances par un verrou.
  const direct = postgres(env.databaseDirectUrl ?? url, { max: 1, prepare: false, onnotice: () => {} });
  try {
    const mdb = drizzle(direct, { schema });
    await mdb.execute(sql`select pg_advisory_lock(727274)`);
    try {
      await migrate(mdb, { migrationsFolder: MIGRATIONS });
      const { seed, ensureAdmin } = await import("./seed");
      await seed(mdb as unknown as DB);
      await ensureAdmin(mdb as unknown as DB);
    } finally {
      await mdb.execute(sql`select pg_advisory_unlock(727274)`);
    }
  } finally {
    await direct.end({ timeout: 5 });
  }

  // prepare:false : compatible avec les poolers (Neon, PgBouncer).
  const client = postgres(url, { max: env.dbPoolMax, prepare: false, onnotice: () => {} });
  return drizzle(client, { schema });
}

async function connectLocal(): Promise<DB> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const { mkdirSync } = await import("node:fs");
  const dir = env.ephemeralDb ? "/tmp/adp-pglite" : path.join(process.cwd(), env.localDbDir);
  mkdirSync(dir, { recursive: true });
  const db = drizzle(new PGlite(dir), { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS });
  const { seed, ensureAdmin } = await import("./seed");
  await seed(db as unknown as DB);
  await ensureAdmin(db as unknown as DB);
  return db as unknown as DB;
}

export function getDb(): Promise<DB> {
  if (!g.__adpDb) {
    g.__adpDb = (env.databaseUrl ? connectPostgres(env.databaseUrl) : connectLocal()).catch((e) => {
      g.__adpDb = undefined;
      throw e;
    });
  }
  return g.__adpDb;
}

export { schema };

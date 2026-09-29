/**
 * Accès base de données — côté serveur uniquement.
 * - DATABASE_URL défini (Supabase / PostgreSQL) : connexion postgres-js. Migrations : `npm run db:migrate`.
 * - Sinon (développement) : PGlite, un vrai PostgreSQL embarqué dans `.data/pglite`, migré et peuplé automatiquement.
 */
import path from "node:path";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { env } from "@/lib/env";
import * as schema from "./schema";

export type DB = PostgresJsDatabase<typeof schema>;
export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];

const MIGRATIONS = path.join(process.cwd(), "drizzle");

type GlobalDb = { __adpDb?: Promise<DB> };
const g = globalThis as unknown as GlobalDb;

async function connect(): Promise<DB> {
  if (env.databaseUrl) {
    const { default: postgres } = await import("postgres");
    const { drizzle } = await import("drizzle-orm/postgres-js");
    // prepare:false : compatible avec le pooler Supabase (mode transaction).
    const client = postgres(env.databaseUrl, { max: 5, prepare: false });
    return drizzle(client, { schema });
  }

  if (env.isProd && process.env.VERCEL) {
    throw new Error("DATABASE_URL est obligatoire en production.");
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const dir = path.join(process.cwd(), env.localDbDir);
  const { mkdirSync } = await import("node:fs");
  mkdirSync(dir, { recursive: true });
  const client = new PGlite(dir);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS });
  const { seed } = await import("./seed");
  await seed(db as unknown as DB);
  return db as unknown as DB;
}

export function getDb(): Promise<DB> {
  if (!g.__adpDb) {
    g.__adpDb = connect().catch((e) => {
      g.__adpDb = undefined;
      throw e;
    });
  }
  return g.__adpDb;
}

export { schema };

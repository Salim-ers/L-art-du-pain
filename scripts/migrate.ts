/** Applique les migrations SQL (dossier drizzle/) sur DATABASE_URL, puis insère les données initiales si la base est vide. */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as schema from "../lib/db/schema";
import { seed } from "../lib/db/seed";
import type { DB } from "../lib/db";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquant (voir .env.example).");
  const client = postgres(url, { max: 1, prepare: false });
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("✓ Migrations appliquées");
  if (!process.argv.includes("--no-seed")) {
    await seed(db as unknown as DB);
    console.log("✓ Données initiales vérifiées");
  }
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

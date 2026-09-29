import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { defaultSettings, settingsSchemas, type SettingsKey, type SettingsMap } from "@/lib/settings-shared";

/** Lit un paramètre ; une valeur absente ou invalide retombe sur la valeur par défaut. */
export async function getSetting<K extends SettingsKey>(key: K): Promise<SettingsMap[K]> {
  const db = await getDb();
  const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, key));
  const parsed = row ? settingsSchemas[key].safeParse(row.value) : null;
  return parsed?.success ? parsed.data : (defaultSettings[key] as SettingsMap[K]);
}

export async function saveSetting<K extends SettingsKey>(key: K, value: SettingsMap[K]) {
  const data = settingsSchemas[key].parse(value);
  const db = await getDb();
  await db
    .insert(schema.settings)
    .values({ key, value: data })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value: data, updatedAt: new Date() } });
}

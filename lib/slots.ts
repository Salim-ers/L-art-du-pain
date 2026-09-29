/** Créneaux de retrait Click & Collect : générés depuis les horaires, moins les fermetures, les créneaux complets et le délai de préparation. */
import { and, gte, lte, ne, sql } from "drizzle-orm";
import { getDb, schema as s, type Tx } from "@/lib/db";
import { addDays, fromMinutes, nowStamp, paris, stamp, toMinutes, weekday } from "@/lib/dates";
import type { ShopSettings } from "@/lib/settings-shared";
import { getSetting } from "@/lib/settings";

export type Slot = { time: string; remaining: number; full: boolean };
export type PickupDay = { date: string; slots: Slot[]; closed: boolean };

type Override = typeof s.pickupSlots.$inferSelect;

export function buildDay(
  date: string,
  shop: ShopSettings,
  overrides: Override[],
  counts: Map<string, number>,
  earliest: number
): PickupDay {
  const own = overrides.filter((o) => o.date === date);
  const whole = own.find((o) => o.time === null);
  if (whole?.closed) return { date, slots: [], closed: true };
  const ranges = shop.hours[weekday(date)] ?? [];
  const slots: Slot[] = [];
  for (const r of ranges) {
    const last = toMinutes(r.close) - shop.lastPickupBeforeCloseMinutes;
    for (let m = toMinutes(r.open); m <= last; m += shop.slotMinutes) {
      const time = fromMinutes(m);
      if (stamp(date, m) < earliest) continue;
      const o = own.find((x) => x.time === time);
      if (o?.closed) continue;
      const capacity = o?.capacity ?? whole?.capacity ?? shop.slotCapacity;
      const used = counts.get(date + "|" + time) ?? 0;
      slots.push({ time, remaining: Math.max(0, capacity - used), full: used >= capacity });
    }
  }
  return { date, slots, closed: ranges.length === 0 };
}

async function loadRange(from: string, to: string, tx?: Tx) {
  const db = tx ?? (await getDb());
  const [overrides, used] = await Promise.all([
    db.select().from(s.pickupSlots).where(and(gte(s.pickupSlots.date, from), lte(s.pickupSlots.date, to))),
    db
      .select({ d: s.orders.pickupDate, t: s.orders.pickupTime, n: sql<number>`count(*)::int` })
      .from(s.orders)
      .where(and(gte(s.orders.pickupDate, from), lte(s.orders.pickupDate, to), ne(s.orders.status, "cancelled")))
      .groupBy(s.orders.pickupDate, s.orders.pickupTime),
  ]);
  return { overrides, counts: new Map(used.map((u) => [u.d + "|" + u.t, u.n])) };
}

export type SlotQuery = { leadHours?: number; dates?: string[] | null };

/** Jours (et créneaux) proposés au client. `dates` restreint aux dates d'une campagne. */
export async function availableDays(q: SlotQuery = {}): Promise<PickupDay[]> {
  const shop = await getSetting("shop");
  const lead = Math.max(shop.minLeadMinutes, (q.leadHours ?? 0) * 60);
  const earliest = nowStamp() + lead;
  const start = paris().date;
  const candidates = q.dates?.length
    ? q.dates.filter((d) => d >= start)
    : Array.from({ length: shop.maxDaysAhead + 1 }, (_, i) => addDays(start, i));
  if (!candidates.length) return [];
  const { overrides, counts } = await loadRange(candidates[0], candidates[candidates.length - 1]);
  return candidates.map((d) => buildDay(d, shop, overrides, counts, earliest));
}

/**
 * Vérification au moment de la commande, dans la transaction (le créneau a pu se remplir entre-temps).
 * Les paramètres sont lus AVANT la transaction : aucune requête hors transaction ne doit s’y glisser.
 */
export async function assertSlot(tx: Tx, shop: ShopSettings, date: string, time: string, q: SlotQuery) {
  if (q.dates?.length && !q.dates.includes(date)) throw new SlotError("Cette date de retrait n’est pas proposée pour votre commande.");
  // Sérialise les commandes sur un même créneau.
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"slot:" + date + "|" + time}))`);
  const { overrides, counts } = await loadRange(date, date, tx);
  const lead = Math.max(shop.minLeadMinutes, (q.leadHours ?? 0) * 60);
  const day = buildDay(date, shop, overrides, counts, nowStamp() + lead);
  const slot = day.slots.find((x) => x.time === time);
  if (!slot) throw new SlotError("Ce créneau n’est plus disponible. Merci d’en choisir un autre.");
  if (slot.full) throw new SlotError("Ce créneau vient d’être complet. Merci d’en choisir un autre.");
}

export class SlotError extends Error {}

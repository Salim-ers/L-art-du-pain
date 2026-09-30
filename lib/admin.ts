import "server-only";
/** Requêtes du back-office (lecture). Toutes les pages appelantes vérifient la session avant. */
import { and, asc, desc, eq, gte, ilike, inArray, isNull, lt, ne, or, sql } from "drizzle-orm";
import { getDb, schema as s } from "@/lib/db";
import type { OrderStatus } from "@/lib/db/schema";
import { addDays, paris, parisDayBounds, today } from "@/lib/dates";
import { visibleOrder } from "@/lib/orders";

/** Chiffre d'affaires : commandes non annulées et réellement engagées (payées, acompte, ou paiement sur place). */
const revenueOrder = and(ne(s.orders.status, "cancelled"), visibleOrder);

export async function todayStats() {
  const db = await getDb();
  const d = today();
  const { start, end } = parisDayBounds(d);
  const [[created], pickups, [custom], [msgs]] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)::int`, ca: sql<number>`coalesce(sum(${s.orders.totalCents}),0)::int` })
      .from(s.orders)
      .where(and(revenueOrder, gte(s.orders.createdAt, start), lt(s.orders.createdAt, end))),
    db
      .select({ status: s.orders.status, n: sql<number>`count(*)::int` })
      .from(s.orders)
      .where(and(eq(s.orders.pickupDate, d), visibleOrder))
      .groupBy(s.orders.status),
    db.select({ n: sql<number>`count(*)::int` }).from(s.customOrders).where(eq(s.customOrders.status, "pending")),
    db.select({ n: sql<number>`count(*)::int` }).from(s.messages).where(eq(s.messages.read, false)),
  ]);
  const count = (...st: OrderStatus[]) => pickups.filter((p) => st.includes(p.status)).reduce((t, p) => t + p.n, 0);
  return {
    date: d,
    orders: created.n,
    revenue: created.ca,
    pickupsToday: count("new", "confirmed", "to_prepare", "in_preparation", "ready", "collected"),
    toPrepare: count("new", "confirmed", "to_prepare"),
    inPreparation: count("in_preparation"),
    ready: count("ready"),
    collected: count("collected"),
    customPending: custom.n,
    unreadMessages: msgs.n,
  };
}

export async function upcomingPickups(limit = 12) {
  const db = await getDb();
  const p = paris();
  const now = `${String(Math.floor(p.minutes / 60)).padStart(2, "0")}:${String(p.minutes % 60).padStart(2, "0")}`;
  const rows = await db
    .select()
    .from(s.orders)
    .where(
      and(
        visibleOrder,
        inArray(s.orders.status, ["new", "confirmed", "to_prepare", "in_preparation", "ready"]),
        or(and(eq(s.orders.pickupDate, p.date), gte(s.orders.pickupTime, addMinutes(now, -60))), gte(s.orders.pickupDate, addDays(p.date, 1)))
      )
    )
    .orderBy(asc(s.orders.pickupDate), asc(s.orders.pickupTime))
    .limit(limit);
  return withItems(rows);
}

function addMinutes(t: string, m: number) {
  const [h, mm] = t.split(":").map(Number);
  const v = Math.max(0, h * 60 + mm + m);
  return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
}

export async function withItems<T extends { id: string }>(rows: T[]) {
  if (!rows.length) return rows.map((r) => ({ ...r, items: [] as (typeof s.orderItems.$inferSelect)[] }));
  const db = await getDb();
  const items = await db.select().from(s.orderItems).where(inArray(s.orderItems.orderId, rows.map((r) => r.id)));
  return rows.map((r) => ({ ...r, items: items.filter((i) => i.orderId === r.id) }));
}

export type OrderFilter = { q?: string; status?: string; date?: string; scope?: "pickup" | "created"; pending?: boolean; page?: number };

export async function listOrders(f: OrderFilter) {
  const db = await getDb();
  const size = 50;
  const page = Math.max(1, f.page ?? 1);
  const q = f.q?.trim();
  const statuses = ["new", "confirmed", "to_prepare", "in_preparation", "ready", "collected", "cancelled"] as const;
  const status = statuses.find((x) => x === f.status);
  const dateFilter = f.date
    ? f.scope === "created"
      ? and(gte(s.orders.createdAt, parisDayBounds(f.date).start), lt(s.orders.createdAt, parisDayBounds(f.date).end))
      : eq(s.orders.pickupDate, f.date)
    : undefined;
  const where = and(
    f.pending ? not(visibleOrder) : visibleOrder,
    status ? eq(s.orders.status, status) : f.status === "open" ? inArray(s.orders.status, ["new", "confirmed", "to_prepare", "in_preparation", "ready"]) : undefined,
    dateFilter,
    q
      ? or(
          ilike(s.orders.number, `%${q}%`),
          ilike(s.orders.lastName, `%${q}%`),
          ilike(s.orders.firstName, `%${q}%`),
          ilike(s.orders.phone, `%${q.replace(/\s/g, "")}%`),
          ilike(s.orders.email, `%${q}%`)
        )
      : undefined
  );
  const rows = await db
    .select()
    .from(s.orders)
    .where(where)
    .orderBy(f.date ? asc(s.orders.pickupTime) : desc(s.orders.createdAt))
    .limit(size + 1)
    .offset((page - 1) * size);
  return { rows: await withItems(rows.slice(0, size)), more: rows.length > size, page };
}

const not = (c: ReturnType<typeof sql>) => sql`not (${c})`;

export async function getOrder(id: string) {
  const db = await getDb();
  const [o] = await db.select().from(s.orders).where(eq(s.orders.id, id));
  if (!o) return null;
  const [items, pays, notes, custom, ev] = await Promise.all([
    db.select().from(s.orderItems).where(eq(s.orderItems.orderId, id)),
    db.select().from(s.payments).where(eq(s.payments.orderId, id)).orderBy(desc(s.payments.createdAt)),
    db.select().from(s.notifications).where(eq(s.notifications.orderId, id)).orderBy(desc(s.notifications.createdAt)),
    db.select().from(s.customOrders).where(eq(s.customOrders.orderId, id)),
    o.eventId ? db.select().from(s.events).where(eq(s.events.id, o.eventId)) : Promise.resolve([]),
  ]);
  return { order: o, items, payments: pays, notifications: notes, custom: custom[0] ?? null, event: ev[0] ?? null };
}

/* ---------- Planning de production ---------- */
export async function production(date: string) {
  const db = await getDb();
  const rows = await db
    .select({
      category: s.orderItems.categoryName,
      name: s.orderItems.name,
      variant: s.orderItems.variantLabel,
      qty: sql<number>`sum(${s.orderItems.quantity})::int`,
      orders: sql<number>`count(distinct ${s.orders.id})::int`,
    })
    .from(s.orderItems)
    .innerJoin(s.orders, eq(s.orderItems.orderId, s.orders.id))
    .where(and(eq(s.orders.pickupDate, date), ne(s.orders.status, "cancelled"), visibleOrder, eq(s.orders.kind, "click_collect")))
    .groupBy(s.orderItems.categoryName, s.orderItems.name, s.orderItems.variantLabel)
    .orderBy(asc(s.orderItems.categoryName), asc(s.orderItems.name), asc(s.orderItems.variantLabel));

  const groups = new Map<string, typeof rows>();
  for (const r of rows) {
    const k = r.category ?? "Autres";
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  const custom = await db
    .select()
    .from(s.customOrders)
    .where(and(eq(s.customOrders.desiredDate, date), inArray(s.customOrders.status, ["pending", "quote_sent", "changes_requested", "accepted"])))
    .orderBy(asc(s.customOrders.desiredTime));
  const orders = await db
    .select()
    .from(s.orders)
    .where(and(eq(s.orders.pickupDate, date), ne(s.orders.status, "cancelled"), visibleOrder))
    .orderBy(asc(s.orders.pickupTime));
  return { groups: [...groups.entries()], custom, orders: await withItems(orders) };
}

/* ---------- Clients ---------- */
export async function listCustomers(q?: string) {
  const db = await getDb();
  const term = q?.trim();
  return db
    .select({
      c: s.customers,
      n: sql<number>`count(${s.orders.id}) filter (where ${s.orders.status} <> 'cancelled')::int`,
      total: sql<number>`coalesce(sum(${s.orders.totalCents}) filter (where ${s.orders.status} <> 'cancelled'),0)::int`,
      last: sql<string | null>`max(${s.orders.createdAt})`,
    })
    .from(s.customers)
    .leftJoin(s.orders, and(eq(s.orders.customerId, s.customers.id), visibleOrder))
    .where(
      term
        ? or(ilike(s.customers.lastName, `%${term}%`), ilike(s.customers.firstName, `%${term}%`), ilike(s.customers.email, `%${term}%`), ilike(s.customers.phone, `%${term.replace(/\s/g, "")}%`))
        : undefined
    )
    .groupBy(s.customers.id)
    .orderBy(desc(sql`max(${s.orders.createdAt})`))
    .limit(200);
}

export async function getCustomer(id: string) {
  const db = await getDb();
  const [c] = await db.select().from(s.customers).where(eq(s.customers.id, id));
  if (!c) return null;
  const [orders, customs, notes] = await Promise.all([
    db.select().from(s.orders).where(and(eq(s.orders.customerId, id), visibleOrder)).orderBy(desc(s.orders.createdAt)),
    db.select().from(s.customOrders).where(eq(s.customOrders.customerId, id)).orderBy(desc(s.customOrders.createdAt)),
    db
      .select({ n: s.customerNotes, author: s.users.name })
      .from(s.customerNotes)
      .leftJoin(s.users, eq(s.customerNotes.authorId, s.users.id))
      .where(eq(s.customerNotes.customerId, id))
      .orderBy(desc(s.customerNotes.createdAt)),
  ]);
  const valid = orders.filter((o) => o.status !== "cancelled");
  return { customer: c, orders, customs, notes, count: valid.length, total: valid.reduce((t, o) => t + o.totalCents, 0), last: orders[0]?.createdAt ?? null };
}

/* ---------- Statistiques ---------- */
export async function stats() {
  const db = await getDb();
  const d = today();
  const since = (days: number) => parisDayBounds(addDays(d, -days + 1)).start;
  const sum = async (from: Date) => {
    const [r] = await db
      .select({ n: sql<number>`count(*)::int`, ca: sql<number>`coalesce(sum(${s.orders.totalCents}),0)::int` })
      .from(s.orders)
      .where(and(revenueOrder, gte(s.orders.createdAt, from)));
    return r;
  };
  const [day, week, month, year] = await Promise.all([sum(since(1)), sum(since(7)), sum(since(30)), sum(since(365))]);

  const daily = await db
    .select({
      d: sql<string>`to_char(${s.orders.createdAt} at time zone 'Europe/Paris', 'YYYY-MM-DD')`,
      ca: sql<number>`coalesce(sum(${s.orders.totalCents}),0)::int`,
      n: sql<number>`count(*)::int`,
    })
    .from(s.orders)
    .where(and(revenueOrder, gte(s.orders.createdAt, since(30))))
    .groupBy(sql`1`)
    .orderBy(sql`1`);

  const top = await db
    .select({ name: s.orderItems.name, qty: sql<number>`sum(${s.orderItems.quantity})::int`, ca: sql<number>`sum(${s.orderItems.quantity} * ${s.orderItems.unitPriceCents})::int` })
    .from(s.orderItems)
    .innerJoin(s.orders, eq(s.orderItems.orderId, s.orders.id))
    .where(and(revenueOrder, gte(s.orders.createdAt, since(90))))
    .groupBy(s.orderItems.name)
    .orderBy(desc(sql`sum(${s.orderItems.quantity})`))
    .limit(10);

  const hours = await db
    .select({ h: sql<string>`substr(${s.orders.pickupTime}, 1, 2)`, n: sql<number>`count(*)::int` })
    .from(s.orders)
    .where(and(revenueOrder, gte(s.orders.createdAt, since(90))))
    .groupBy(sql`1`)
    .orderBy(sql`1`);

  const [recurring] = await db.select({ n: sql<number>`count(*)::int` }).from(
    db
      .select({ c: s.orders.customerId })
      .from(s.orders)
      .where(and(revenueOrder, sql`${s.orders.customerId} is not null`))
      .groupBy(s.orders.customerId)
      .having(sql`count(*) >= 2`)
      .as("r")
  );
  const [customers] = await db.select({ n: sql<number>`count(*)::int` }).from(s.customers);

  const seasonal = await db
    .select({ name: s.events.name, n: sql<number>`count(${s.orders.id})::int`, ca: sql<number>`coalesce(sum(${s.orders.totalCents}),0)::int` })
    .from(s.events)
    .leftJoin(s.orders, and(eq(s.orders.eventId, s.events.id), revenueOrder))
    .groupBy(s.events.id, s.events.name)
    .orderBy(desc(sql`count(${s.orders.id})`));

  return { day, week, month, year, daily, top, hours, recurring: recurring.n, customers: customers.n, seasonal, avg: month.n ? Math.round(month.ca / month.n) : 0 };
}

export async function unreadNotifications(limit = 12) {
  const db = await getDb();
  return db
    .select()
    .from(s.notifications)
    .where(and(eq(s.notifications.audience, "staff"), eq(s.notifications.channel, "dashboard"), isNull(s.notifications.readAt)))
    .orderBy(desc(s.notifications.createdAt))
    .limit(limit);
}


import "server-only";
/**
 * Cycle de vie des commandes. Tous les prix, stocks, créneaux et quotas sont recalculés ici, côté serveur.
 */
import { timingSafeEqual } from "node:crypto";
import { and, eq, isNull, lt, or, sql } from "drizzle-orm";
import { getDb, schema as s, type Tx } from "@/lib/db";
import { env } from "@/lib/env";
import type { Order, OrderStatus, Promotion } from "@/lib/db/schema";
import { listProducts, type ProductView } from "@/lib/catalog";
import { campaignState } from "@/lib/events";
import { money } from "@/lib/format";
import { mails, notifyStaff, sendEmail } from "@/lib/notify";
import { logError, token } from "@/lib/security";
import { getSetting } from "@/lib/settings";
import { assertSlot } from "@/lib/slots";
import { createCheckout, stripe } from "@/lib/stripe";
import { orderInput, type OrderInput } from "@/lib/validation";

export class OrderError extends Error {}

export const ORDERING_CLOSED = "La commande en ligne ouvre très bientôt. En attendant, appelez-nous au 03 65 65 89 09 ou passez en boutique.";
/** Sans base de données permanente, aucune commande n'est acceptée (elle serait perdue). */
export function assertOrderingOpen() {
  if (env.ephemeralDb) throw new OrderError(ORDERING_CLOSED);
}

/* ---------- Numérotation : 2026-00145 ---------- */
export async function nextNumber(tx: Tx, prefix = "") {
  const year = new Date().getFullYear();
  const key = `${prefix}order-${year}`;
  const [row] = await tx
    .insert(s.counters)
    .values({ key, value: 1 })
    .onConflictDoUpdate({ target: s.counters.key, set: { value: sql`${s.counters.value} + 1` } })
    .returning();
  return `${prefix}${year}-${String(row.value).padStart(5, "0")}`;
}

/* ---------- Clients ---------- */
export async function upsertCustomer(tx: Tx, c: { firstName: string; lastName: string; email: string; phone: string }) {
  const [row] = await tx
    .insert(s.customers)
    .values(c)
    .onConflictDoUpdate({ target: s.customers.email, set: { firstName: c.firstName, lastName: c.lastName, phone: c.phone, updatedAt: new Date() } })
    .returning();
  return row;
}

/* ---------- Promotions ---------- */
export async function findPromotion(code: string | null, subtotal: number): Promise<{ promo: Promotion; discount: number } | null> {
  if (!code) return null;
  const db = await getDb();
  const now = new Date();
  const [promo] = await db.select().from(s.promotions).where(and(sql`upper(${s.promotions.code}) = ${code.toUpperCase()}`, eq(s.promotions.active, true)));
  if (!promo) throw new OrderError("Code promo inconnu.");
  if ((promo.startsAt && now < promo.startsAt) || (promo.endsAt && now > promo.endsAt)) throw new OrderError("Ce code promo n’est pas valable actuellement.");
  if (promo.maxUses !== null && promo.uses >= promo.maxUses) throw new OrderError("Ce code promo a atteint sa limite d’utilisation.");
  if (subtotal < promo.minSubtotalCents) throw new OrderError(`Ce code est valable dès ${money(promo.minSubtotalCents)} d’achat.`);
  const discount = promo.type === "percent" ? Math.round((subtotal * Math.min(100, promo.value)) / 100) : Math.min(subtotal, promo.value);
  return { promo, discount };
}

/* ---------- Stock ---------- */
async function takeStock(tx: Tx, productId: string, variantId: string | null, qty: number, name: string) {
  const where = and(eq(s.inventory.productId, productId), variantId ? eq(s.inventory.variantId, variantId) : isNull(s.inventory.variantId));
  const [row] = await tx.select().from(s.inventory).where(where).for("update");
  if (!row?.tracked) return;
  if (row.quantity < qty) throw new OrderError(row.quantity > 0 ? `Plus que ${row.quantity} « ${name} » disponible(s).` : `« ${name} » est épuisé.`);
  await tx.update(s.inventory).set({ quantity: row.quantity - qty, updatedAt: new Date() }).where(eq(s.inventory.id, row.id));
}

async function restoreStock(tx: Tx, orderId: string) {
  const items = await tx.select().from(s.orderItems).where(eq(s.orderItems.orderId, orderId));
  for (const i of items) {
    if (!i.productId) continue;
    await tx
      .update(s.inventory)
      .set({ quantity: sql`${s.inventory.quantity} + ${i.quantity}`, updatedAt: new Date() })
      .where(
        and(
          eq(s.inventory.productId, i.productId),
          i.variantId ? eq(s.inventory.variantId, i.variantId) : isNull(s.inventory.variantId),
          eq(s.inventory.tracked, true)
        )
      );
  }
}

/* ---------- Prix et règles du panier ---------- */
export type PricedLine = { product: ProductView; variantId: string | null; label: string | null; unit: number; quantity: number };

export async function priceCart(lines: { productId: string; variantId: string | null; quantity: number }[]) {
  const products = await listProducts({ ids: [...new Set(lines.map((l) => l.productId))] });
  const priced: PricedLine[] = [];
  for (const l of lines) {
    const p = products.find((x) => x.id === l.productId);
    if (!p) throw new OrderError("Un produit de votre panier n’est plus proposé. Merci de mettre à jour votre panier.");
    if (!p.orderable) throw new OrderError(`« ${p.name} » : ${p.unavailable?.toLowerCase()}.`);
    let unit = p.priceCents;
    let label: string | null = null;
    if (p.variants.length) {
      const v = p.variants.find((x) => x.id === l.variantId);
      if (!v) throw new OrderError(`Merci de choisir un format pour « ${p.name} ».`);
      if (v.stock === 0) throw new OrderError(`« ${p.name} — ${v.label} » est épuisé.`);
      unit = v.priceCents;
      label = v.label;
    } else if (l.variantId) throw new OrderError(`Format inconnu pour « ${p.name} ».`);
    priced.push({ product: p, variantId: p.variants.length ? l.variantId : null, label, unit, quantity: l.quantity });
  }

  // Les créations de saison ne se commandent que pendant leur campagne, et une seule campagne par commande.
  const campaigns = [...new Map(priced.filter((l) => l.product.seasonal && l.product.campaign).map((l) => [l.product.campaign!.id, l.product.campaign!])).values()];
  if (campaigns.length > 1) throw new OrderError("Les créations de deux campagnes différentes doivent faire l’objet de commandes séparées.");
  const campaign = campaigns[0] ?? null;
  const leadHours = Math.max(0, ...priced.map((l) => l.product.leadTimeHours));
  const subtotal = priced.reduce((t, l) => t + l.unit * l.quantity, 0);
  return { lines: priced, campaign, leadHours, subtotal };
}

/* ---------- Création ---------- */
export type PlaceResult = { redirect: string };

export async function placeOrder(raw: OrderInput): Promise<PlaceResult> {
  assertOrderingOpen();
  const input = orderInput.parse(raw);
  await releaseExpiredPayments();
  const payments = await getSetting("payments");
  if (input.paymentMethod === "card" && (!payments.card || !stripe())) throw new OrderError("Le paiement en ligne est momentanément indisponible.");
  if (input.paymentMethod === "on_site" && !payments.onSite) throw new OrderError("Le paiement en boutique n’est pas proposé.");

  const cart = await priceCart(input.items);
  const promo = await findPromotion(input.promoCode, cart.subtotal);
  const discount = promo?.discount ?? 0;
  const total = cart.subtotal - discount;
  if (input.paymentMethod === "card" && total < 50) throw new OrderError("Montant minimum pour un paiement en ligne : 0,50 €.");

  const shop = await getSetting("shop");
  const db = await getDb();
  const order = await db.transaction(async (tx) => {
    await assertSlot(tx, shop, input.pickupDate, input.pickupTime, { leadHours: cart.leadHours, dates: cart.campaign?.dates ?? null });

    if (cart.campaign) {
      const [ev] = await tx.select().from(s.events).where(eq(s.events.id, cart.campaign.id)).for("update");
      const [{ n }] = await tx
        .select({ n: sql<number>`count(*)::int` })
        .from(s.orders)
        .where(and(eq(s.orders.eventId, ev.id), sql`${s.orders.status} <> 'cancelled'`));
      const state = campaignState(ev, n);
      if (state !== "open") throw new OrderError(state === "full" ? `${ev.name} : les précommandes sont complètes.` : `${ev.name} : les précommandes ne sont pas ouvertes.`);
    }

    for (const l of cart.lines) await takeStock(tx, l.product.id, l.variantId, l.quantity, l.product.name);

    if (promo) {
      const done = await tx
        .update(s.promotions)
        .set({ uses: sql`${s.promotions.uses} + 1` })
        .where(and(eq(s.promotions.id, promo.promo.id), or(isNull(s.promotions.maxUses), lt(s.promotions.uses, s.promotions.maxUses))))
        .returning();
      if (!done.length) throw new OrderError("Ce code promo a atteint sa limite d’utilisation.");
    }

    const customer = await upsertCustomer(tx, input);
    const [o] = await tx
      .insert(s.orders)
      .values({
        number: await nextNumber(tx),
        accessToken: token(),
        customerId: customer.id,
        kind: "click_collect",
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        pickupDate: input.pickupDate,
        pickupTime: input.pickupTime,
        subtotalCents: cart.subtotal,
        discountCents: discount,
        totalCents: total,
        amountDueNowCents: input.paymentMethod === "card" ? total : 0,
        paymentMethod: input.paymentMethod,
        paymentStatus: input.paymentMethod === "card" ? "pending" : "on_site",
        promotionId: promo?.promo.id ?? null,
        eventId: cart.campaign?.id ?? null,
        customerNote: input.note,
      })
      .returning();
    await tx.insert(s.orderItems).values(
      cart.lines.map((l) => ({
        orderId: o.id,
        productId: l.product.id,
        variantId: l.variantId,
        categoryName: l.product.category?.name ?? null,
        name: l.product.name,
        variantLabel: l.label,
        unitPriceCents: l.unit,
        quantity: l.quantity,
        vatRate: 0,
      }))
    );
    // TVA figée au moment de la commande.
    await tx.execute(sql`update order_items oi set vat_rate = p.vat_rate from products p where oi.product_id = p.id and oi.order_id = ${o.id}`);
    return o;
  });

  const track = `/commande/suivi?n=${encodeURIComponent(order.number)}&t=${order.accessToken}`;
  if (input.paymentMethod === "on_site") {
    await afterOrderPlaced(order.id);
    return { redirect: track + "&ok=1" };
  }

  try {
    const [pay] = await db.insert(s.payments).values({ orderId: order.id, provider: "stripe", kind: "full", amountCents: total, status: "pending" }).returning();
    const session = await createCheckout({
      label: `Commande ${order.number} — L’Art du Pain`,
      description: cart.lines.map((l) => `${l.quantity} × ${l.product.name}${l.label ? " (" + l.label + ")" : ""}`).join(", "),
      amountCents: total,
      email: order.email,
      meta: { kind: "order", orderId: order.id, paymentId: pay.id },
      successPath: track + "&paid=1",
      cancelPath: "/commande?annule=1",
    });
    await db.update(s.payments).set({ stripeSessionId: session.id }).where(eq(s.payments.id, pay.id));
    return { redirect: session.url! };
  } catch (e) {
    logError("checkout", e);
    await cancelOrder(order.id, null, { silent: true });
    throw new OrderError("Le paiement n’a pas pu être initialisé. Aucun montant n’a été prélevé, merci de réessayer.");
  }
}

async function loadOrder(id: string) {
  const db = await getDb();
  const [o] = await db.select().from(s.orders).where(eq(s.orders.id, id));
  const items = o ? await db.select().from(s.orderItems).where(eq(s.orderItems.orderId, id)) : [];
  return o ? { order: o, items } : null;
}

async function afterOrderPlaced(orderId: string) {
  const data = await loadOrder(orderId);
  if (!data) return;
  const { order, items } = data;
  await sendEmail(order.email, "order.received", mails.orderReceived(order, items), { orderId });
  await notifyStaff(
    "order.new",
    `Nouvelle commande ${order.number}`,
    `${order.firstName} ${order.lastName} — ${money(order.totalCents)} — retrait le ${order.pickupDate} à ${order.pickupTime}`,
    { orderId }
  );
}

/* ---------- Paiement ---------- */
/** Idempotent : peut être appelé par le webhook et par la page de retour. */
export async function markPaymentSucceeded(paymentId: string, sessionId: string, paymentIntent: string | null, amount: number) {
  const db = await getDb();
  const updated = await db
    .update(s.payments)
    .set({ status: "succeeded", stripeSessionId: sessionId, stripePaymentIntent: paymentIntent, amountCents: amount, updatedAt: new Date() })
    .where(and(eq(s.payments.id, paymentId), sql`${s.payments.status} <> 'succeeded'`))
    .returning();
  const pay = updated[0];
  if (!pay) return null;
  return pay;
}

export async function onOrderPaid(orderId: string, paymentId: string, sessionId: string, paymentIntent: string | null, amount: number) {
  const pay = await markPaymentSucceeded(paymentId, sessionId, paymentIntent, amount);
  if (!pay) return;
  const db = await getDb();
  const [o] = await db.select().from(s.orders).where(eq(s.orders.id, orderId));
  if (!o) return;
  const paid = o.amountPaidCents + amount;
  await db
    .update(s.orders)
    .set({ amountPaidCents: paid, paymentStatus: paid >= o.totalCents ? "paid" : "partially_paid", updatedAt: new Date() })
    .where(eq(s.orders.id, orderId));
  if (o.status === "cancelled") {
    // Paiement arrivé après expiration : on remet la commande en circuit et on alerte l'équipe.
    await db.update(s.orders).set({ status: "new", cancelledAt: null }).where(eq(s.orders.id, orderId));
    await notifyStaff("order.late_payment", `Paiement tardif — ${o.number}`, "Commande annulée automatiquement puis payée : vérifier le créneau et le stock.", { orderId });
  }
  await afterOrderPlaced(orderId);
}

export async function onCheckoutExpired(paymentId: string) {
  const db = await getDb();
  const [pay] = await db
    .update(s.payments)
    .set({ status: "expired", updatedAt: new Date() })
    .where(and(eq(s.payments.id, paymentId), eq(s.payments.status, "pending")))
    .returning();
  if (pay?.orderId) {
    const [o] = await db.select().from(s.orders).where(eq(s.orders.id, pay.orderId));
    if (o && o.paymentStatus === "pending" && o.kind === "click_collect") await cancelOrder(o.id, null, { silent: true });
  }
}

/** Libère créneaux et stock des paiements en ligne abandonnés (> 45 min), même sans webhook. */
export async function releaseExpiredPayments() {
  try {
    const db = await getDb();
    const stale = await db
      .select({ id: s.orders.id })
      .from(s.orders)
      .where(
        and(
          eq(s.orders.paymentMethod, "card"),
          eq(s.orders.paymentStatus, "pending"),
          eq(s.orders.kind, "click_collect"),
          sql`${s.orders.status} <> 'cancelled'`,
          lt(s.orders.createdAt, new Date(Date.now() - 45 * 60 * 1000))
        )
      );
    for (const o of stale) {
      await db.update(s.payments).set({ status: "expired", updatedAt: new Date() }).where(and(eq(s.payments.orderId, o.id), eq(s.payments.status, "pending")));
      await cancelOrder(o.id, null, { silent: true });
    }
  } catch (e) {
    logError("releaseExpired", e);
  }
}

/** Vérifie directement auprès de Stripe (utile en local, sans webhook). */
export async function reconcileOrderPayment(orderId: string) {
  const st = stripe();
  if (!st) return;
  const db = await getDb();
  const pending = await db.select().from(s.payments).where(and(eq(s.payments.orderId, orderId), eq(s.payments.status, "pending")));
  for (const p of pending) {
    if (!p.stripeSessionId) continue;
    try {
      const session = await st.checkout.sessions.retrieve(p.stripeSessionId);
      if (session.payment_status === "paid") {
        await onOrderPaid(orderId, p.id, session.id, typeof session.payment_intent === "string" ? session.payment_intent : null, session.amount_total ?? p.amountCents);
      }
    } catch (e) {
      logError("reconcile", e);
    }
  }
}

/* ---------- Statuts (administration) ---------- */
export async function cancelOrder(orderId: string, _userId: string | null, opts: { silent?: boolean } = {}) {
  const db = await getDb();
  const o = await db.transaction(async (tx) => {
    const [o] = await tx.select().from(s.orders).where(eq(s.orders.id, orderId)).for("update");
    if (!o || o.status === "cancelled") return null;
    if (!o.stockReleased) await restoreStock(tx, o.id);
    if (o.promotionId) await tx.update(s.promotions).set({ uses: sql`greatest(${s.promotions.uses} - 1, 0)` }).where(eq(s.promotions.id, o.promotionId));
    const [u] = await tx
      .update(s.orders)
      .set({ status: "cancelled", cancelledAt: new Date(), stockReleased: true, updatedAt: new Date() })
      .where(eq(s.orders.id, o.id))
      .returning();
    return u;
  });
  if (o && !opts.silent) await sendEmail(o.email, "order.cancelled", mails.orderCancelled(o), { orderId });
  return o;
}

export async function setOrderStatus(orderId: string, status: OrderStatus, userId: string) {
  if (status === "cancelled") return cancelOrder(orderId, userId);
  const db = await getDb();
  const now = new Date();
  const stamps: Partial<Order> =
    status === "confirmed" ? { confirmedAt: now } : status === "ready" ? { readyAt: now } : status === "collected" ? { collectedAt: now } : {};
  const [o] = await db.update(s.orders).set({ status, ...stamps, updatedAt: now }).where(eq(s.orders.id, orderId)).returning();
  if (!o) return null;
  const cfg = await getSetting("notify");
  if (status === "confirmed" && cfg.sendConfirmedEmail) await sendEmail(o.email, "order.confirmed", mails.orderConfirmed(o), { orderId });
  if (status === "ready" && cfg.sendReadyEmail) await sendEmail(o.email, "order.ready", mails.orderReady(o), { orderId });
  if (status === "collected" && o.paymentMethod === "on_site" && o.paymentStatus === "on_site") {
    await db.update(s.orders).set({ amountPaidCents: o.totalCents, paymentStatus: "paid" }).where(eq(s.orders.id, orderId));
    await db.insert(s.payments).values({ orderId, provider: "on_site", kind: "full", amountCents: o.totalCents, status: "succeeded" });
  }
  return o;
}

/** Commandes « réelles » : exclut les paiements en ligne non aboutis. */
export const visibleOrder = sql`not (${s.orders.paymentMethod} = 'card' and ${s.orders.paymentStatus} in ('pending','failed') and ${s.orders.amountPaidCents} = 0)`;

export async function findOrderForCustomer(number: string, secret: { token?: string; email?: string }) {
  const db = await getDb();
  const [o] = await db.select().from(s.orders).where(eq(s.orders.number, number.trim()));
  if (!o) return null;
  const okToken = !!secret.token && secret.token.length === o.accessToken.length && timingSafeEqual(Buffer.from(secret.token), Buffer.from(o.accessToken));
  const okEmail = secret.email && secret.email.trim().toLowerCase() === o.email;
  if (!okToken && !okEmail) return null;
  const items = await db.select().from(s.orderItems).where(eq(s.orderItems.orderId, o.id));
  return { order: o, items };
}


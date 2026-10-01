import "server-only";
/**
 * Gâteaux sur mesure et commandes particulières : le client envoie une DEMANDE ; la boulangerie l'accepte,
 * la refuse, demande des précisions ou envoie un devis. Le paiement direct d'un acompte n'est proposé que si
 * les estimations de prix sont activées (tarifs validés par la boutique).
 */
import { timingSafeEqual } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { getDb, schema as s } from "@/lib/db";
import type { CustomOrder } from "@/lib/db/schema";
import { addDays, paris } from "@/lib/dates";
import { env } from "@/lib/env";
import { money } from "@/lib/format";
import { mails, notifyStaff, sendEmail } from "@/lib/notify";
import { assertOrderingOpen, nextNumber, OrderError, upsertCustomer } from "@/lib/orders";
import { logError, token } from "@/lib/security";
import { getSetting } from "@/lib/settings";
import { availableDays } from "@/lib/slots";
import { createCheckout, stripe } from "@/lib/stripe";
import { customInput, specialInput } from "@/lib/validation";
import { specialRequestTypes } from "@/content/special";
import type { z } from "zod";

const servingsNumber = (v: string) => parseInt(v, 10) || 1;

export async function customConfig() {
  const [cake, payments] = await Promise.all([getSetting("cake"), getSetting("payments")]);
  // Sans estimation validée, aucun prix ne peut être payé d'avance : uniquement une demande.
  const online = payments.card && !!stripe() && cake.showEstimate;
  const modes: ("quote" | "pay")[] =
    payments.customCakeMode === "both" ? (online ? ["pay", "quote"] : ["quote"]) : payments.customCakeMode === "pay" && online ? ["pay"] : ["quote"];
  return { cake, modes, depositPercent: payments.depositPercent };
}

export async function customDays() {
  const cake = await getSetting("cake");
  const from = addDays(paris().date, cake.minDaysNotice);
  const days = await availableDays({ leadHours: cake.minDaysNotice * 24 });
  return days.filter((d) => d.date >= from);
}

export function estimate(cake: Awaited<ReturnType<typeof getSetting<"cake">>>, typeId: string, servings: string) {
  const type = cake.types.find((t) => t.id === typeId);
  return type ? type.pricePerServingCents * servingsNumber(servings) : null;
}

export async function createCustomOrder(input: z.output<typeof customInput>, inspirationRef: string | null) {
  assertOrderingOpen();
  const { cake, modes, depositPercent } = await customConfig();
  if (!modes.includes(input.mode)) throw new OrderError("Ce mode de commande n’est pas disponible.");
  if (!cake.occasions.includes(input.occasion)) throw new OrderError("Occasion inconnue.");
  if (!cake.servings.includes(input.servings)) throw new OrderError("Nombre de personnes invalide.");
  const type = cake.types.find((t) => t.id === input.cakeType);
  if (!type) throw new OrderError("Type de gâteau inconnu.");
  if (input.flavors.length > cake.maxFlavors || input.flavors.some((f) => !cake.flavors.includes(f))) throw new OrderError("Saveurs invalides.");
  const days = await customDays();
  const day = days.find((d) => d.date === input.desiredDate);
  if (!day || !day.slots.some((x) => x.time === input.desiredTime)) throw new OrderError("Cette date n’est pas disponible. Merci d’en choisir une autre.");

  const est = cake.showEstimate ? estimate(cake, type.id, input.servings) : null;
  const db = await getDb();
  const custom = await db.transaction(async (tx) => {
    const customer = await upsertCustomer(tx, input);
    const [c] = await tx
      .insert(s.customOrders)
      .values({
        number: await nextNumber(tx, "SM-"),
        accessToken: token(),
        customerId: customer.id,
        mode: input.mode,
        occasion: input.occasion,
        servings: input.servings,
        cakeType: type.name,
        flavors: input.flavors,
        message: input.message,
        inspirationImage: inspirationRef,
        desiredDate: input.desiredDate,
        desiredTime: input.desiredTime,
        comment: input.comment,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        estimateCents: est,
        quoteCents: input.mode === "pay" ? est : null,
        kind: "cake",
        depositPercent: input.mode === "pay" ? depositPercent : null,
      })
      .returning();
    return c;
  });

  if (input.mode === "quote" || depositPercent === 0) {
    await afterCustomReceived(custom);
    return { redirect: `/gateaux-sur-mesure/suivi?n=${encodeURIComponent(custom.number)}&t=${custom.accessToken}&ok=1` };
  }
  return { redirect: await customCheckout(custom) };
}

async function afterCustomReceived(c: CustomOrder) {
  await sendEmail(c.email, "custom.received", mails.customReceived(c), { customOrderId: c.id });
  await notifyStaff(
    "custom.new",
    `${c.kind === "special" ? "Commande particulière" : "Gâteau sur mesure"} ${c.number}`,
    `${c.occasion} — ${c.firstName} ${c.lastName} — ${c.servings}${c.kind === "special" ? "" : " pers."} — le ${c.desiredDate}`,
    { customOrderId: c.id }
  );
}

/** Commande particulière (entreprise, grande quantité, buffet…) : enregistrée comme demande à étudier. */
export async function createSpecialRequest(input: z.output<typeof specialInput>, photoRef: string | null) {
  assertOrderingOpen();
  if (!(specialRequestTypes as readonly string[]).includes(input.type)) throw new OrderError("Type de demande inconnu.");
  const today = paris().date;
  if (input.desiredDate <= today || input.desiredDate > addDays(today, 365)) throw new OrderError("Merci de choisir une date à venir (au plus tard dans un an).");
  const db = await getDb();
  const c = await db.transaction(async (tx) => {
    const customer = await upsertCustomer(tx, input);
    const [row] = await tx
      .insert(s.customOrders)
      .values({
        number: await nextNumber(tx, "CS-"),
        accessToken: token(),
        customerId: customer.id,
        kind: "special",
        mode: "quote",
        occasion: input.type,
        servings: input.quantity,
        cakeType: "Commande particulière",
        flavors: [],
        inspirationImage: photoRef,
        desiredDate: input.desiredDate,
        desiredTime: null,
        comment: input.comment,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
      })
      .returning();
    return row;
  });
  await afterCustomReceived(c);
  return { redirect: `/gateaux-sur-mesure/suivi?n=${encodeURIComponent(c.number)}&t=${c.accessToken}&ok=1` };
}

export const depositOf = (c: Pick<CustomOrder, "quoteCents" | "depositPercent">) =>
  Math.round(((c.quoteCents ?? 0) * (c.depositPercent ?? 100)) / 100);

/** Session Stripe pour l'acompte (ou le total) d'un gâteau sur mesure. */
export async function customCheckout(c: CustomOrder) {
  const amount = depositOf(c);
  if (amount < 50) throw new OrderError("Montant d’acompte invalide.");
  const db = await getDb();
  const [pay] = await db
    .insert(s.payments)
    .values({ customOrderId: c.id, provider: "stripe", kind: amount >= (c.quoteCents ?? 0) ? "full" : "deposit", amountCents: amount, status: "pending" })
    .returning();
  const track = `/gateaux-sur-mesure/suivi?n=${encodeURIComponent(c.number)}&t=${c.accessToken}`;
  try {
    const session = await createCheckout({
      label: `Gâteau sur mesure ${c.number}${c.depositPercent && c.depositPercent < 100 ? ` — acompte ${c.depositPercent} %` : ""}`,
      description: `${c.occasion}, ${c.servings} personnes, ${c.cakeType} — retrait le ${c.desiredDate}`,
      amountCents: amount,
      email: c.email,
      meta: { kind: "custom", customOrderId: c.id, paymentId: pay.id },
      successPath: track + "&paid=1",
      cancelPath: track,
    });
    await db.update(s.payments).set({ stripeSessionId: session.id }).where(eq(s.payments.id, pay.id));
    return session.url!;
  } catch (e) {
    logError("custom.checkout", e);
    await db.update(s.payments).set({ status: "failed" }).where(eq(s.payments.id, pay.id));
    throw new OrderError("Le paiement n’a pas pu être initialisé. Merci de réessayer.");
  }
}

/** Crée la commande Click & Collect liée (planning, retrait, encaissement). */
async function ensureLinkedOrder(c: CustomOrder, paidCents: number) {
  const db = await getDb();
  if (c.orderId) {
    const [o] = await db.select().from(s.orders).where(eq(s.orders.id, c.orderId));
    if (o && paidCents) {
      const paid = o.amountPaidCents + paidCents;
      const [u] = await db
        .update(s.orders)
        .set({ amountPaidCents: paid, paymentStatus: paid >= o.totalCents ? "paid" : "partially_paid", paymentMethod: "card", updatedAt: new Date() })
        .where(eq(s.orders.id, o.id))
        .returning();
      return u;
    }
    return o;
  }
  const total = c.quoteCents ?? c.estimateCents ?? 0;
  return db.transaction(async (tx) => {
    const [o] = await tx
      .insert(s.orders)
      .values({
        number: await nextNumber(tx),
        accessToken: token(),
        customerId: c.customerId,
        kind: "custom",
        status: c.status === "accepted" ? "confirmed" : "new",
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        pickupDate: c.desiredDate,
        pickupTime: c.desiredTime ?? "10:00",
        subtotalCents: total,
        totalCents: total,
        amountDueNowCents: paidCents,
        amountPaidCents: paidCents,
        paymentMethod: paidCents ? "card" : "on_site",
        paymentStatus: paidCents ? (paidCents >= total ? "paid" : "partially_paid") : "on_site",
        customerNote: c.message ? `Inscription : « ${c.message} »` : null,
        confirmedAt: c.status === "accepted" ? new Date() : null,
      })
      .returning();
    await tx.insert(s.orderItems).values({
      orderId: o.id,
      categoryName: c.kind === "special" ? "Commandes particulières" : "Gâteaux sur mesure",
      name: c.kind === "special" ? `Commande particulière — ${c.occasion}` : `Gâteau ${c.cakeType} — ${c.occasion}`,
      variantLabel: c.kind === "special" ? c.servings : `${c.servings} personnes · ${c.flavors.join(" / ")}`,
      unitPriceCents: total,
      quantity: 1,
      vatRate: 550,
      note: c.message ? `« ${c.message} »` : null,
    });
    await tx.update(s.customOrders).set({ orderId: o.id, updatedAt: new Date() }).where(eq(s.customOrders.id, c.id));
    return o;
  });
}

export async function onCustomPaid(customOrderId: string, paymentId: string, sessionId: string, paymentIntent: string | null, amount: number) {
  const db = await getDb();
  const [pay] = await db
    .update(s.payments)
    .set({ status: "succeeded", stripeSessionId: sessionId, stripePaymentIntent: paymentIntent, amountCents: amount, updatedAt: new Date() })
    .where(and(eq(s.payments.id, paymentId), sql`${s.payments.status} <> 'succeeded'`))
    .returning();
  if (!pay) return;
  const [c] = await db.select().from(s.customOrders).where(eq(s.customOrders.id, customOrderId));
  if (!c) return;
  // Devis payé = accepté par le client. Paiement direct = reste « à valider » par la Maison.
  const status = c.status === "quote_sent" ? "accepted" : c.status;
  const [u] = await db.update(s.customOrders).set({ status, updatedAt: new Date() }).where(eq(s.customOrders.id, c.id)).returning();
  const o = await ensureLinkedOrder(u, amount);
  await db.update(s.payments).set({ orderId: o.id }).where(eq(s.payments.id, pay.id));
  if (status === "accepted") {
    await sendEmail(u.email, "custom.accepted", mails.customAccepted(u, o), { customOrderId: u.id, orderId: o.id });
    await notifyStaff("custom.paid", `Devis accepté et payé — ${u.number}`, `${u.firstName} ${u.lastName} — ${money(amount)} réglés`, { customOrderId: u.id });
  } else {
    await afterCustomReceived(u);
  }
}

export async function reconcileCustomPayment(customOrderId: string) {
  const st = stripe();
  if (!st) return;
  const db = await getDb();
  const pending = await db.select().from(s.payments).where(and(eq(s.payments.customOrderId, customOrderId), eq(s.payments.status, "pending")));
  for (const p of pending) {
    if (!p.stripeSessionId) continue;
    try {
      const session = await st.checkout.sessions.retrieve(p.stripeSessionId);
      if (session.payment_status === "paid")
        await onCustomPaid(customOrderId, p.id, session.id, typeof session.payment_intent === "string" ? session.payment_intent : null, session.amount_total ?? p.amountCents);
    } catch (e) {
      logError("custom.reconcile", e);
    }
  }
}

/* ---------- Actions de la Maison ---------- */
export async function customAction(
  id: string,
  action: "accept" | "changes" | "refuse" | "quote" | "cancel",
  data: { message?: string | null; quoteCents?: number; depositPercent?: number }
) {
  const db = await getDb();
  const [c] = await db.select().from(s.customOrders).where(eq(s.customOrders.id, id));
  if (!c) throw new OrderError("Demande introuvable.");
  const set = (v: Partial<CustomOrder>) => db.update(s.customOrders).set({ ...v, updatedAt: new Date() }).where(eq(s.customOrders.id, id)).returning();
  const msg = data.message ?? null;

  if (action === "quote") {
    if (!data.quoteCents || data.quoteCents < 100) throw new OrderError("Montant du devis invalide.");
    const [u] = await set({ status: "quote_sent", quoteCents: data.quoteCents, depositPercent: data.depositPercent ?? 30, adminMessage: msg });
    await sendEmail(u.email, "custom.quote", mails.customQuote(u, quoteLink(u)), { customOrderId: id });
    return u;
  }
  if (action === "changes") {
    const [u] = await set({ status: "changes_requested", adminMessage: msg });
    await sendEmail(u.email, "custom.changes", mails.customChanges(u), { customOrderId: id });
    return u;
  }
  if (action === "refuse" || action === "cancel") {
    const [u] = await set({ status: action === "refuse" ? "refused" : "cancelled", adminMessage: msg });
    if (u.orderId) await db.update(s.orders).set({ status: "cancelled", cancelledAt: new Date() }).where(eq(s.orders.id, u.orderId));
    if (action === "refuse") await sendEmail(u.email, "custom.refused", mails.customRefused(u), { customOrderId: id });
    return u;
  }
  // accept
  const [u] = await set({ status: "accepted", adminMessage: msg ?? c.adminMessage, quoteCents: c.quoteCents ?? c.estimateCents });
  const o = await ensureLinkedOrder(u, 0);
  if (o.status === "new") await db.update(s.orders).set({ status: "confirmed", confirmedAt: new Date() }).where(eq(s.orders.id, o.id));
  await sendEmail(u.email, "custom.accepted", mails.customAccepted(u, o), { customOrderId: id, orderId: o.id });
  return u;
}

export const quoteLink = (c: Pick<CustomOrder, "number" | "accessToken">) =>
  `${env.siteUrl}/gateaux-sur-mesure/suivi?n=${encodeURIComponent(c.number)}&t=${c.accessToken}`;

/** Le client accepte un devis sans acompte. */
export async function acceptQuoteWithoutDeposit(c: CustomOrder) {
  if (c.status !== "quote_sent" || depositOf(c) > 0) throw new OrderError("Action impossible.");
  const db = await getDb();
  const [u] = await db.update(s.customOrders).set({ status: "accepted", updatedAt: new Date() }).where(eq(s.customOrders.id, c.id)).returning();
  const o = await ensureLinkedOrder(u, 0);
  await sendEmail(u.email, "custom.accepted", mails.customAccepted(u, o), { customOrderId: u.id, orderId: o.id });
  await notifyStaff("custom.accepted", `Devis accepté — ${u.number}`, `${u.firstName} ${u.lastName}`, { customOrderId: u.id });
}

export async function findCustomForCustomer(number: string, tok: string) {
  const db = await getDb();
  const [c] = await db.select().from(s.customOrders).where(eq(s.customOrders.number, number.trim()));
  if (!c || tok.length !== c.accessToken.length || !timingSafeEqual(Buffer.from(tok), Buffer.from(c.accessToken))) return null;
  return c;
}

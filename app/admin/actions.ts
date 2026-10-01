"use server";

import bcrypt from "bcryptjs";
import { and, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect";
import { z } from "zod";
import { AuthError, endSession, hasRole, requireAction, startSession } from "@/lib/auth/session";
import { customAction } from "@/lib/custom";
import { getDb, schema as s } from "@/lib/db";
import type { Role, User } from "@/lib/db/schema";
import { isIsoDate } from "@/lib/dates";
import { canSignSessions } from "@/lib/env";
import { slugify } from "@/lib/format";
import { ALLERGENS } from "@/lib/labels";
import { mails, sendEmail, sendMessage } from "@/lib/notify";
import { OrderError, setOrderStatus } from "@/lib/orders";
import { audit, clientIp, limitOrThrow, logError, rateLimit, RateLimitError } from "@/lib/security";
import { saveSetting } from "@/lib/settings";
import { cakeSchema, catalogSchema, notifySchema, paymentSchema, reassuranceSchema, reviewsSchema, shopSchema } from "@/lib/settings-shared";
import { readImage, savePublicImage, UploadError } from "@/lib/storage";
import { email as emailSchema, firstError, text } from "@/lib/validation";

/* ---------- Outils ---------- */
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const opt = (fd: FormData, k: string) => str(fd, k) || null;
const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";
const int = (fd: FormData, k: string) => {
  const v = str(fd, k);
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
};
/** "12,50" → 1250 */
const cents = (v: string) => {
  const n = Number(v.replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || n > 100000) throw new OrderError("Montant invalide : " + v);
  return Math.round(n * 100);
};
const uuid = z.uuid();

function safeBack(fd: FormData, fallback: string) {
  const b = str(fd, "back");
  return b.startsWith("/admin") && !b.startsWith("//") ? b : fallback;
}

function withMsg(url: string, key: "ok" | "err", msg: string) {
  const [path, qs = ""] = url.split("?");
  const p = new URLSearchParams(qs);
  p.delete("ok");
  p.delete("err");
  p.set(key, msg);
  return `${path}?${p.toString()}`;
}

/** Exécute une action protégée, puis redirige avec un message (jamais de détail technique côté client). */
async function run(fd: FormData, min: Role, fallback: string, fn: (u: User) => Promise<string | void>) {
  const back = safeBack(fd, fallback);
  let target: string;
  try {
    const u = await requireAction(min);
    const msg = await fn(u);
    // Tout le site : pages de gestion et pages publiques mises en cache (catalogue, stock, campagnes, réglages).
    revalidatePath("/", "layout");
    target = withMsg(back, "ok", msg || "Enregistré");
  } catch (e) {
    if (isRedirectError(e)) throw e;
    if (e instanceof AuthError && /Session/.test(e.message)) redirect("/admin/login");
    const known = e instanceof AuthError || e instanceof OrderError || e instanceof UploadError || e instanceof RateLimitError;
    if (e instanceof z.ZodError) target = withMsg(back, "err", firstError(e));
    else if (known) target = withMsg(back, "err", (e as Error).message);
    else {
      logError("admin.action", e);
      target = withMsg(back, "err", "Erreur inattendue — rien n’a été modifié.");
    }
  }
  redirect(target);
}

/* ---------- Authentification ---------- */
let DUMMY: string | undefined;
export async function login(_: unknown, fd: FormData) {
  if (!canSignSessions()) return { error: "Base de données non connectée : connectez Neon dans Vercel (Storage), puis redéployez." };
  const email = str(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const ip = clientIp();
  if (!rateLimit("login:" + ip, 10, 900) || !rateLimit("login:" + email, 6, 900)) return { error: "Trop de tentatives. Réessayez dans 15 minutes." };
  const db = await getDb();
  const [u] = await db.select().from(s.users).where(eq(s.users.email, email));
  // Comparaison systématique pour ne pas révéler l'existence du compte par le temps de réponse.
  const ok = await bcrypt.compare(password, u?.passwordHash ?? (DUMMY ??= bcrypt.hashSync("timing-equalizer", 12)));
  if (!u || !ok || !u.active) {
    await audit(u?.id ?? null, "login.failed", "user", email, { ip });
    return { error: "Identifiants incorrects." };
  }
  await db.update(s.users).set({ lastLoginAt: new Date() }).where(eq(s.users.id, u.id));
  await startSession(u);
  await audit(u.id, "login", "user", u.id, { ip });
  redirect("/admin");
}

export async function logout() {
  endSession();
  redirect("/admin/login");
}

/* ---------- Commandes ---------- */
const statusEnum = z.enum(["new", "confirmed", "to_prepare", "in_preparation", "ready", "collected", "cancelled"]);

export async function orderStatus(fd: FormData) {
  await run(fd, "STAFF", "/admin/commandes", async (u) => {
    const id = uuid.parse(str(fd, "id"));
    const status = statusEnum.parse(str(fd, "status"));
    await setOrderStatus(id, status, u.id);
    await audit(u.id, "order.status", "order", id, { status });
    return "Statut mis à jour";
  });
}

export async function orderUpdate(fd: FormData) {
  await run(fd, "STAFF", "/admin/commandes", async (u) => {
    const id = uuid.parse(str(fd, "id"));
    const date = str(fd, "pickupDate");
    const time = str(fd, "pickupTime");
    if (!isIsoDate(date) || !/^\d{2}:\d{2}$/.test(time)) throw new OrderError("Date ou heure invalide.");
    const db = await getDb();
    await db
      .update(s.orders)
      .set({ pickupDate: date, pickupTime: time, customerNote: text(500).parse(str(fd, "customerNote")) || null, internalNote: text(2000).parse(str(fd, "internalNote")) || null, updatedAt: new Date() })
      .where(eq(s.orders.id, id));
    await audit(u.id, "order.update", "order", id, { date, time });
    return "Commande modifiée";
  });
}

export async function orderMarkPaid(fd: FormData) {
  await run(fd, "ADMIN", "/admin/commandes", async (u) => {
    const id = uuid.parse(str(fd, "id"));
    const db = await getDb();
    const [o] = await db.select().from(s.orders).where(eq(s.orders.id, id));
    if (!o) throw new OrderError("Commande introuvable.");
    const due = o.totalCents - o.amountPaidCents;
    if (due <= 0) return "Déjà soldée";
    await db.update(s.orders).set({ amountPaidCents: o.totalCents, paymentStatus: "paid", updatedAt: new Date() }).where(eq(s.orders.id, id));
    await db.insert(s.payments).values({ orderId: id, provider: "on_site", kind: o.amountPaidCents ? "balance" : "full", amountCents: due, status: "succeeded" });
    await audit(u.id, "order.paid", "order", id, { due });
    return "Encaissement enregistré";
  });
}

export async function orderNotify(fd: FormData) {
  await run(fd, "STAFF", "/admin/commandes", async (u) => {
    limitOrThrow("admin-notify", 30, 600);
    const id = uuid.parse(str(fd, "id"));
    const kind = z.enum(["received", "confirmed", "ready", "sms-ready", "whatsapp-ready"]).parse(str(fd, "kind"));
    const db = await getDb();
    const [o] = await db.select().from(s.orders).where(eq(s.orders.id, id));
    if (!o) throw new OrderError("Commande introuvable.");
    if (kind === "received") await sendEmail(o.email, "order.received", mails.orderReceived(o, await db.select().from(s.orderItems).where(eq(s.orderItems.orderId, id))), { orderId: id });
    if (kind === "confirmed") await sendEmail(o.email, "order.confirmed", mails.orderConfirmed(o), { orderId: id });
    if (kind === "ready") await sendEmail(o.email, "order.ready", mails.orderReady(o), { orderId: id });
    if (kind === "sms-ready" || kind === "whatsapp-ready")
      await sendMessage(kind === "sms-ready" ? "sms" : "whatsapp", o.phone, "order.ready", `L’Art du Pain : votre commande ${o.number} est prête. À tout de suite !`, { orderId: id });
    await audit(u.id, "order.notify", "order", id, { kind });
    return "Message envoyé (voir l’historique)";
  });
}

export async function markNotificationsRead(fd: FormData) {
  await run(fd, "STAFF", "/admin", async () => {
    const db = await getDb();
    await db.update(s.notifications).set({ readAt: new Date() }).where(and(eq(s.notifications.audience, "staff"), isNull(s.notifications.readAt)));
    return "Notifications lues";
  });
}

/* ---------- Commandes personnalisées ---------- */
export async function customAct(fd: FormData) {
  const action = z.enum(["accept", "changes", "refuse", "quote", "cancel"]).parse(str(fd, "action"));
  await run(fd, action === "quote" ? "ADMIN" : "STAFF", "/admin/sur-mesure", async (u) => {
    const id = uuid.parse(str(fd, "id"));
    const message = text(1500).parse(str(fd, "message")) || null;
    const data: { message: string | null; quoteCents?: number; depositPercent?: number } = { message };
    if (action === "quote") {
      data.quoteCents = cents(str(fd, "quote"));
      data.depositPercent = z.number().int().min(0).max(100).parse(int(fd, "deposit") ?? 30);
    }
    await customAction(id, action, data);
    await audit(u.id, "custom." + action, "custom_order", id, data);
    return { accept: "Commande acceptée", changes: "Demande de modification envoyée", refuse: "Demande refusée", quote: "Devis envoyé", cancel: "Commande annulée" }[action];
  });
}

/* ---------- Clients ---------- */
export async function addCustomerNote(fd: FormData) {
  await run(fd, "STAFF", "/admin/clients", async (u) => {
    const id = uuid.parse(str(fd, "customerId"));
    const body = text(2000, 1).parse(str(fd, "body"));
    const db = await getDb();
    await db.insert(s.customerNotes).values({ customerId: id, authorId: u.id, body });
    return "Note ajoutée";
  });
}

export async function deleteCustomerNote(fd: FormData) {
  await run(fd, "ADMIN", "/admin/clients", async () => {
    const db = await getDb();
    await db.delete(s.customerNotes).where(eq(s.customerNotes.id, uuid.parse(str(fd, "id"))));
    return "Note supprimée";
  });
}

/* ---------- Produits ---------- */
async function uniqueSlug(table: typeof s.products | typeof s.categories | typeof s.events, base: string, exceptId?: string) {
  const db = await getDb();
  let slug = slugify(base) || "item";
  for (let i = 2; i < 50; i++) {
    const [hit] = await db.select({ id: table.id }).from(table).where(eq(table.slug, slug));
    if (!hit || hit.id === exceptId) return slug;
    slug = `${slugify(base)}-${i}`;
  }
  return slug + "-" + Date.now();
}

export async function saveProduct(fd: FormData) {
  await run(fd, "ADMIN", "/admin/produits", async (u) => {
    const db = await getDb();
    const id = opt(fd, "id");
    const name = text(120, 1).parse(str(fd, "name"));
    const img = await readImage(fd.get("imageFile"));
    const image = img ? await savePublicImage(img, "produits") : opt(fd, "image");
    const allergens = fd.getAll("allergens").map(String).filter((a) => ALLERGENS.includes(a));
    const categoryId = opt(fd, "categoryId");
    const values = {
      name,
      slug: await uniqueSlug(s.products, opt(fd, "slug") ?? name, id ?? undefined),
      categoryId: categoryId ? uuid.parse(categoryId) : null,
      shortDescription: text(240).parse(str(fd, "shortDescription")) || null,
      description: text(2000).parse(str(fd, "description")) || null,
      composition: text(1000).parse(str(fd, "composition")) || null,
      image,
      priceCents: cents(str(fd, "price") || "0"),
      vatRate: z.number().int().min(0).max(2000).parse(Math.round(Number(str(fd, "vat").replace(",", ".")) * 100)),
      allergens,
      active: bool(fd, "active"),
      orderable: bool(fd, "orderable"),
      clickCollect: bool(fd, "clickCollect"),
      seasonal: bool(fd, "seasonal"),
      featured: bool(fd, "featured"),
      leadTimeHours: z.number().int().min(0).max(720).parse(int(fd, "leadTimeHours") ?? 0),
      minQuantity: z.number().int().min(1, "Quantité minimale : 1 au moins").max(50, "Quantité minimale : 50 au plus").parse(int(fd, "minQuantity") ?? 1),
      // Une fiche enregistrée par la boutique devient une vraie donnée, sauf si elle reste explicitement marquée « exemple ».
      isDemo: bool(fd, "isDemo"),
      position: int(fd, "position") ?? 0,
      updatedAt: new Date(),
    };
    const productId = await db.transaction(async (tx) => {
      const [p] = id
        ? await tx.update(s.products).set(values).where(eq(s.products.id, uuid.parse(id))).returning()
        : await tx.insert(s.products).values(values).returning();
      // Formats : lignes répétées vId[] / vLabel[] / vServings[] / vPrice[] / vRemove[]
      const ids = fd.getAll("vId").map(String);
      const labels = fd.getAll("vLabel").map(String);
      const servings = fd.getAll("vServings").map(String);
      const prices = fd.getAll("vPrice").map(String);
      const removed = new Set(fd.getAll("vRemove").map(String));
      for (let i = 0; i < labels.length; i++) {
        const label = labels[i].trim();
        const vid = ids[i];
        if (vid && removed.has(vid)) {
          // Désactivé plutôt que supprimé : l'historique des commandes y fait référence.
          await tx.update(s.productVariants).set({ active: false }).where(and(eq(s.productVariants.id, vid), eq(s.productVariants.productId, p.id)));
          continue;
        }
        if (!label) continue;
        const v = { label: label.slice(0, 60), servings: servings[i] ? Math.round(Number(servings[i])) || null : null, priceCents: cents(prices[i] || "0"), position: i, active: true };
        if (vid) await tx.update(s.productVariants).set(v).where(and(eq(s.productVariants.id, vid), eq(s.productVariants.productId, p.id)));
        else await tx.insert(s.productVariants).values({ ...v, productId: p.id });
      }
      return p.id;
    });
    await audit(u.id, id ? "product.update" : "product.create", "product", productId, { name, price: values.priceCents });
    if (!id) redirect(withMsg("/admin/produits/" + productId, "ok", "Produit créé"));
    return "Produit enregistré";
  });
}

export async function toggleProduct(fd: FormData) {
  await run(fd, "ADMIN", "/admin/produits", async (u) => {
    const id = uuid.parse(str(fd, "id"));
    const db = await getDb();
    await db.update(s.products).set({ active: sql`not ${s.products.active}`, updatedAt: new Date() }).where(eq(s.products.id, id));
    await audit(u.id, "product.toggle", "product", id);
    return "Visibilité modifiée";
  });
}

/* ---------- Catégories ---------- */
export async function saveCategory(fd: FormData) {
  await run(fd, "ADMIN", "/admin/categories", async (u) => {
    const db = await getDb();
    const id = opt(fd, "id");
    const name = text(80, 1).parse(str(fd, "name"));
    const img = await readImage(fd.get("imageFile"));
    const values = {
      name,
      slug: await uniqueSlug(s.categories, opt(fd, "slug") ?? name, id ?? undefined),
      tagline: text(160).parse(str(fd, "tagline")) || null,
      description: text(1000).parse(str(fd, "description")) || null,
      seoTitle: text(120).parse(str(fd, "seoTitle")) || null,
      seoDescription: text(300).parse(str(fd, "seoDescription")) || null,
      image: img ? await savePublicImage(img, "categories") : opt(fd, "image"),
      position: int(fd, "position") ?? 0,
      active: bool(fd, "active"),
      clickCollect: bool(fd, "clickCollect"),
    };
    if (id) await db.update(s.categories).set(values).where(eq(s.categories.id, uuid.parse(id)));
    else await db.insert(s.categories).values(values);
    await audit(u.id, "category.save", "category", id ?? values.slug);
    return "Catégorie enregistrée";
  });
}

/* ---------- Stock ---------- */
export async function saveStock(fd: FormData) {
  await run(fd, "STAFF", "/admin/stock", async (u) => {
    const db = await getDb();
    const productId = uuid.parse(str(fd, "productId"));
    const variantId = opt(fd, "variantId");
    const tracked = str(fd, "mode") === "limited";
    const quantity = z.number().int().min(0).max(100000).parse(int(fd, "quantity") ?? 0);
    const daily = int(fd, "dailyQuantity");
    await db
      .insert(s.inventory)
      .values({ productId, variantId: variantId ? uuid.parse(variantId) : null, tracked, quantity, dailyQuantity: daily })
      .onConflictDoUpdate({ target: [s.inventory.productId, s.inventory.variantId], set: { tracked, quantity, dailyQuantity: daily, updatedAt: new Date() } });
    await audit(u.id, "stock.save", "product", productId, { variantId, tracked, quantity });
    return "Stock mis à jour";
  });
}

export async function resetDailyStock(fd: FormData) {
  await run(fd, "STAFF", "/admin/stock", async (u) => {
    const db = await getDb();
    const rows = await db
      .update(s.inventory)
      .set({ quantity: sql`${s.inventory.dailyQuantity}`, updatedAt: new Date() })
      .where(and(eq(s.inventory.tracked, true), sql`${s.inventory.dailyQuantity} is not null`))
      .returning();
    await audit(u.id, "stock.reset_daily", "inventory", undefined, { n: rows.length });
    return `${rows.length} stock(s) du jour réinitialisé(s)`;
  });
}

/* ---------- Campagnes / événements ---------- */
const parisDateTime = (v: string) => {
  if (!v) return null;
  // Saisie « YYYY-MM-DDTHH:MM » en heure de Paris.
  const guess = new Date(v + ":00Z");
  if (Number.isNaN(guess.getTime())) throw new OrderError("Date invalide.");
  const local = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", hourCycle: "h23" }).format(guess);
  const offset = Number(local) - guess.getUTCHours();
  return new Date(guess.getTime() - ((offset + 24) % 24) * 3600000);
};

export async function saveEvent(fd: FormData) {
  await run(fd, "ADMIN", "/admin/evenements", async (u) => {
    const db = await getDb();
    const id = opt(fd, "id");
    const name = text(120, 1).parse(str(fd, "name"));
    const img = await readImage(fd.get("imageFile"));
    const pickupDates = str(fd, "pickupDates")
      .split(/[\s,;]+/)
      .map((d) => d.trim())
      .filter(Boolean);
    if (pickupDates.some((d) => !isIsoDate(d))) throw new OrderError("Dates de retrait : format AAAA-MM-JJ, séparées par des virgules.");
    const start = opt(fd, "pickupStart");
    const end = opt(fd, "pickupEnd");
    if ((start && !isIsoDate(start)) || (end && !isIsoDate(end))) throw new OrderError("Plage de retrait invalide.");
    const values = {
      name,
      slug: await uniqueSlug(s.events, opt(fd, "slug") ?? name, id ?? undefined),
      kind: z.string().max(30).parse(str(fd, "kind") || "custom"),
      headline: text(120).parse(str(fd, "headline")) || null,
      subtitle: text(200).parse(str(fd, "subtitle")) || null,
      description: text(3000).parse(str(fd, "description")) || null,
      heroImage: img ? await savePublicImage(img, "evenements") : opt(fd, "heroImage"),
      published: bool(fd, "published"),
      orderOpensAt: parisDateTime(str(fd, "orderOpensAt")),
      orderClosesAt: parisDateTime(str(fd, "orderClosesAt")),
      pickupStart: start,
      pickupEnd: end,
      pickupDates: [...new Set(pickupDates)].sort(),
      maxOrders: int(fd, "maxOrders"),
      position: int(fd, "position") ?? 0,
      seoTitle: text(120).parse(str(fd, "seoTitle")) || null,
      seoDescription: text(300).parse(str(fd, "seoDescription")) || null,
      updatedAt: new Date(),
    };
    const products = fd.getAll("products").map((p) => uuid.parse(String(p)));
    const eventId = await db.transaction(async (tx) => {
      const [e] = id
        ? await tx.update(s.events).set(values).where(eq(s.events.id, uuid.parse(id))).returning()
        : await tx.insert(s.events).values(values).returning();
      await tx.delete(s.eventProducts).where(eq(s.eventProducts.eventId, e.id));
      if (products.length) await tx.insert(s.eventProducts).values(products.map((productId, position) => ({ eventId: e.id, productId, position })));
      return e.id;
    });
    await audit(u.id, id ? "event.update" : "event.create", "event", eventId, { name, published: values.published });
    if (!id) redirect(withMsg("/admin/evenements/" + eventId, "ok", "Campagne créée"));
    return "Campagne enregistrée";
  });
}

/* ---------- Promotions ---------- */
export async function savePromotion(fd: FormData) {
  await run(fd, "ADMIN", "/admin/promotions", async (u) => {
    const db = await getDb();
    const id = opt(fd, "id");
    const type = z.enum(["percent", "amount"]).parse(str(fd, "type"));
    const values = {
      code: z.string().regex(/^[A-Z0-9_-]{3,30}$/, "Code : 3 à 30 caractères, lettres majuscules et chiffres").parse(str(fd, "code").toUpperCase()),
      label: text(80, 1).parse(str(fd, "label")),
      type,
      value: type === "percent" ? z.number().int().min(1).max(100).parse(int(fd, "value") ?? 0) : cents(str(fd, "value")),
      minSubtotalCents: cents(str(fd, "min") || "0"),
      startsAt: parisDateTime(str(fd, "startsAt")),
      endsAt: parisDateTime(str(fd, "endsAt")),
      maxUses: int(fd, "maxUses"),
      active: bool(fd, "active"),
    };
    if (id) await db.update(s.promotions).set(values).where(eq(s.promotions.id, uuid.parse(id)));
    else await db.insert(s.promotions).values(values);
    await audit(u.id, "promotion.save", "promotion", id ?? values.code, values);
    return "Code promo enregistré";
  });
}

/* ---------- Messages ---------- */
export async function markMessage(fd: FormData) {
  await run(fd, "STAFF", "/admin/messages", async () => {
    const db = await getDb();
    await db.update(s.messages).set({ read: bool(fd, "read") }).where(eq(s.messages.id, uuid.parse(str(fd, "id"))));
    return "Message mis à jour";
  });
}

/* ---------- Galerie ---------- */
const formatEnum = z.enum(["wide", "portrait", "square", "landscape", "medium"]);
const mediaCat = z.enum(["pains", "viennoiseries", "patisseries", "boutique", "evenements"]);

export async function uploadMedia(fd: FormData) {
  await run(fd, "ADMIN", "/admin/galerie", async (u) => {
    const files = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0).slice(0, 6);
    if (!files.length) throw new UploadError("Choisissez au moins une image.");
    const db = await getDb();
    for (const f of files) {
      const img = await readImage(f);
      if (!img) continue;
      const url = await savePublicImage(img, "galerie");
      await db.insert(s.media).values({
        url,
        alt: text(200).parse(str(fd, "alt")) || f.name.replace(/\.[a-z]+$/i, "").replace(/[-_]/g, " "),
        caption: opt(fd, "caption"),
        category: mediaCat.parse(str(fd, "category") || "boutique"),
        format: formatEnum.parse(str(fd, "format") || "landscape"),
        position: int(fd, "position") ?? 100,
      });
    }
    await audit(u.id, "media.upload", "media", undefined, { n: files.length });
    return `${files.length} image(s) ajoutée(s)`;
  });
}

export async function updateMedia(fd: FormData) {
  await run(fd, "ADMIN", "/admin/galerie", async () => {
    const db = await getDb();
    const id = uuid.parse(str(fd, "id"));
    if (str(fd, "delete") === "1") {
      await db.delete(s.media).where(eq(s.media.id, id));
      return "Image retirée";
    }
    await db
      .update(s.media)
      .set({
        alt: text(200).parse(str(fd, "alt")),
        caption: text(120).parse(str(fd, "caption")) || null,
        category: mediaCat.parse(str(fd, "category")),
        format: formatEnum.parse(str(fd, "format")),
        position: int(fd, "position") ?? 0,
        inGallery: bool(fd, "inGallery"),
      })
      .where(eq(s.media.id, id));
    return "Image mise à jour";
  });
}

/* ---------- Paramètres ---------- */
export async function saveShopSettings(fd: FormData) {
  await run(fd, "ADMIN", "/admin/parametres", async (u) => {
    const hours = Array.from({ length: 7 }, (_, d) => {
      if (!bool(fd, `open-${d}`)) return [];
      const r = [{ open: str(fd, `o1-${d}`), close: str(fd, `c1-${d}`) }];
      if (str(fd, `o2-${d}`) && str(fd, `c2-${d}`)) r.push({ open: str(fd, `o2-${d}`), close: str(fd, `c2-${d}`) });
      return r;
    });
    const shop = shopSchema.parse({
      hours,
      slotMinutes: int(fd, "slotMinutes"),
      slotCapacity: int(fd, "slotCapacity"),
      minLeadMinutes: int(fd, "minLeadMinutes"),
      maxDaysAhead: int(fd, "maxDaysAhead"),
      lastPickupBeforeCloseMinutes: int(fd, "lastPickupBeforeCloseMinutes"),
    });
    await saveSetting("shop", shop);
    await audit(u.id, "settings.shop", "settings", "shop", shop);
    return "Horaires et créneaux enregistrés";
  });
}

export async function addClosure(fd: FormData) {
  await run(fd, "STAFF", "/admin/planning", async (u) => {
    const date = str(fd, "date");
    if (!isIsoDate(date)) throw new OrderError("Date invalide.");
    const time = opt(fd, "time");
    if (time && !/^\d{2}:\d{2}$/.test(time)) throw new OrderError("Heure invalide.");
    const capacity = int(fd, "capacity");
    const db = await getDb();
    await db.insert(s.pickupSlots).values({ date, time, closed: capacity === null, capacity, note: opt(fd, "note") });
    await audit(u.id, "slots.override", "pickup_slots", date, { time, capacity });
    return capacity === null ? "Fermeture enregistrée" : "Capacité ajustée";
  });
}

export async function removeClosure(fd: FormData) {
  await run(fd, "STAFF", "/admin/planning", async () => {
    const db = await getDb();
    await db.delete(s.pickupSlots).where(eq(s.pickupSlots.id, uuid.parse(str(fd, "id"))));
    return "Exception supprimée";
  });
}

export async function savePaymentSettings(fd: FormData) {
  await run(fd, "ADMIN", "/admin/parametres", async (u) => {
    const v = paymentSchema.parse({ card: bool(fd, "card"), onSite: bool(fd, "onSite"), customCakeMode: str(fd, "customCakeMode"), depositPercent: int(fd, "depositPercent") });
    await saveSetting("payments", v);
    await audit(u.id, "settings.payments", "settings", "payments", v);
    return "Paiements enregistrés";
  });
}

const lines = (v: string) => v.split("\n").map((l) => l.trim()).filter(Boolean);

export async function saveCakeSettings(fd: FormData) {
  await run(fd, "ADMIN", "/admin/parametres", async (u) => {
    const ids = fd.getAll("tId").map(String);
    const names = fd.getAll("tName").map(String);
    const descs = fd.getAll("tDesc").map(String);
    const images = fd.getAll("tImage").map(String);
    const prices = fd.getAll("tPrice").map(String);
    const types = names
      .map((name, i) => ({
        id: ids[i] || slugify(name),
        name: name.trim(),
        description: (descs[i] ?? "").trim(),
        image: images[i]?.trim() || null,
        pricePerServingCents: prices[i] ? cents(prices[i]) : 0,
      }))
      .filter((t) => t.name);
    const v = cakeSchema.parse({
      occasions: lines(str(fd, "occasions")),
      servings: lines(str(fd, "servings")),
      flavors: lines(str(fd, "flavors")),
      types,
      maxFlavors: int(fd, "maxFlavors"),
      minDaysNotice: int(fd, "minDaysNotice"),
      showEstimate: bool(fd, "showEstimate"),
    });
    await saveSetting("cake", v);
    await audit(u.id, "settings.cake", "settings", "cake");
    return "Options sur mesure enregistrées";
  });
}

export async function saveReviewSettings(fd: FormData) {
  await run(fd, "ADMIN", "/admin/parametres", async (u) => {
    const texts = fd.getAll("rText").map(String);
    const authors = fd.getAll("rAuthor").map(String);
    const ratings = fd.getAll("rRating").map(String);
    const items = texts
      .map((t, i) => ({ text: t.trim(), author: (authors[i] ?? "").trim(), source: "Google", rating: ratings[i] ? Number(ratings[i]) : undefined }))
      .filter((r) => r.text && r.author);
    const v = reviewsSchema.parse({ googleReviewUrl: opt(fd, "googleReviewUrl"), items });
    await saveSetting("reviews", v);
    await audit(u.id, "settings.reviews", "settings", "reviews");
    return "Avis enregistrés";
  });
}

/** Mode démonstration : affiche ou masque partout les produits et campagnes d'exemple. */
export async function saveCatalogSettings(fd: FormData) {
  await run(fd, "ADMIN", "/admin/parametres", async (u) => {
    const v = catalogSchema.parse({ demo: bool(fd, "demo") });
    await saveSetting("catalog", v);
    await audit(u.id, "settings.catalog", "settings", "catalog", v);
    return v.demo ? "Mode démonstration activé" : "Mode démonstration désactivé : seules les vraies données sont visibles";
  });
}

export async function saveReassuranceSettings(fd: FormData) {
  await run(fd, "ADMIN", "/admin/parametres", async (u) => {
    const titles = fd.getAll("aTitle").map(String);
    const texts = fd.getAll("aText").map(String);
    const items = titles.map((t, i) => ({ title: t.trim(), text: (texts[i] ?? "").trim() })).filter((a) => a.title);
    const v = reassuranceSchema.parse({ items });
    await saveSetting("reassurance", v);
    await audit(u.id, "settings.reassurance", "settings", "reassurance");
    return "Engagements enregistrés";
  });
}

export async function saveNotifySettings(fd: FormData) {
  await run(fd, "ADMIN", "/admin/parametres", async (u) => {
    const v = notifySchema.parse({ staffEmail: opt(fd, "staffEmail"), sendReadyEmail: bool(fd, "sendReadyEmail"), sendConfirmedEmail: bool(fd, "sendConfirmedEmail") });
    await saveSetting("notify", v);
    await audit(u.id, "settings.notify", "settings", "notify");
    return "Notifications enregistrées";
  });
}

/* ---------- Équipe ---------- */
const password = z.string().min(10, "Mot de passe : 10 caractères minimum").max(200);

export async function createUser(fd: FormData) {
  await run(fd, "ADMIN", "/admin/parametres", async (u) => {
    const role = z.enum(["STAFF", "ADMIN", "SUPER_ADMIN"]).parse(str(fd, "role"));
    if (role !== "STAFF" && !hasRole(u, "SUPER_ADMIN")) throw new AuthError("Seul un super administrateur peut créer un administrateur.");
    const db = await getDb();
    const [created] = await db
      .insert(s.users)
      .values({ email: emailSchema.parse(str(fd, "email")), name: text(80, 1).parse(str(fd, "name")), role, passwordHash: await bcrypt.hash(password.parse(String(fd.get("password") ?? "")), 12) })
      .onConflictDoNothing()
      .returning();
    if (!created) throw new OrderError("Un compte existe déjà avec cet email.");
    await audit(u.id, "user.create", "user", created.id, { role });
    return "Compte créé";
  });
}

export async function updateUser(fd: FormData) {
  await run(fd, "ADMIN", "/admin/parametres", async (u) => {
    const db = await getDb();
    const id = uuid.parse(str(fd, "id"));
    const [target] = await db.select().from(s.users).where(eq(s.users.id, id));
    if (!target) throw new OrderError("Compte introuvable.");
    if (target.role !== "STAFF" && !hasRole(u, "SUPER_ADMIN")) throw new AuthError("Seul un super administrateur peut modifier un administrateur.");
    const op = str(fd, "op");
    if (op === "toggle") {
      if (target.id === u.id) throw new OrderError("Vous ne pouvez pas désactiver votre propre compte.");
      await db.update(s.users).set({ active: !target.active, tokenVersion: target.tokenVersion + 1 }).where(eq(s.users.id, id));
    } else if (op === "password") {
      await db.update(s.users).set({ passwordHash: await bcrypt.hash(password.parse(String(fd.get("password") ?? "")), 12), tokenVersion: target.tokenVersion + 1 }).where(eq(s.users.id, id));
    } else if (op === "revoke") {
      await db.update(s.users).set({ tokenVersion: target.tokenVersion + 1 }).where(eq(s.users.id, id));
    } else throw new OrderError("Action inconnue.");
    await audit(u.id, "user." + op, "user", id);
    return "Compte mis à jour";
  });
}

export async function changeOwnPassword(fd: FormData) {
  await run(fd, "STAFF", "/admin/parametres", async (u) => {
    if (!(await bcrypt.compare(String(fd.get("current") ?? ""), u.passwordHash))) throw new OrderError("Mot de passe actuel incorrect.");
    const db = await getDb();
    const [fresh] = await db
      .update(s.users)
      .set({ passwordHash: await bcrypt.hash(password.parse(String(fd.get("password") ?? "")), 12), tokenVersion: u.tokenVersion + 1 })
      .where(eq(s.users.id, u.id))
      .returning();
    await startSession(fresh);
    await audit(u.id, "user.password", "user", u.id);
    return "Mot de passe modifié";
  });
}

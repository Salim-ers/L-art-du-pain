/**
 * Schéma de la base (PostgreSQL — Neon en production). Montants en centimes, TVA en points de base (550 = 5,5 %).
 * Dates de retrait en "YYYY-MM-DD" + heure "HH:MM", fuseau Europe/Paris.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const roleEnum = pgEnum("role", ["SUPER_ADMIN", "ADMIN", "STAFF"]);
export const orderStatusEnum = pgEnum("order_status", [
  "new",
  "confirmed",
  "to_prepare",
  "in_preparation",
  "ready",
  "collected",
  "cancelled",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "partially_paid",
  "on_site",
  "refunded",
  "failed",
]);
export const customStatusEnum = pgEnum("custom_status", [
  "pending",
  "quote_sent",
  "changes_requested",
  "accepted",
  "refused",
  "cancelled",
]);

/* ---------- Équipe ---------- */
export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("STAFF"),
  active: boolean("active").notNull().default(true),
  // Incrémenté pour invalider toutes les sessions d'un utilisateur.
  tokenVersion: integer("token_version").notNull().default(0),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: createdAt(),
});

/* ---------- Clients (CRM) ---------- */
export const customers = pgTable("customers", {
  id: id(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const customerNotes = pgTable("customer_notes", {
  id: id(),
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
  body: text("body").notNull(),
  createdAt: createdAt(),
});

/* ---------- Catalogue ---------- */
export const categories = pgTable("categories", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  tagline: text("tagline"),
  description: text("description"),
  image: text("image"),
  position: integer("position").notNull().default(0),
  active: boolean("active").notNull().default(true),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  createdAt: createdAt(),
});

export const products = pgTable(
  "products",
  {
    id: id(),
    slug: text("slug").notNull().unique(),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    shortDescription: text("short_description"),
    description: text("description"),
    composition: text("composition"),
    image: text("image"),
    priceCents: integer("price_cents").notNull(),
    vatRate: integer("vat_rate").notNull().default(550),
    allergens: jsonb("allergens").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    active: boolean("active").notNull().default(true),
    orderable: boolean("orderable").notNull().default(true),
    clickCollect: boolean("click_collect").notNull().default(true),
    seasonal: boolean("seasonal").notNull().default(false),
    featured: boolean("featured").notNull().default(false),
    // Délai minimum de préparation avant retrait.
    leadTimeHours: integer("lead_time_hours").notNull().default(0),
    position: integer("position").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("products_category_idx").on(t.categoryId)]
);

// Formats d'un produit (ex. bûche 4 / 6 / 8 personnes) — prix propre à chaque format.
export const productVariants = pgTable(
  "product_variants",
  {
    id: id(),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    servings: integer("servings"),
    priceCents: integer("price_cents").notNull(),
    position: integer("position").notNull().default(0),
    active: boolean("active").notNull().default(true),
  },
  (t) => [index("variants_product_idx").on(t.productId)]
);

// Stock : une ligne par produit (et par format le cas échéant). Absence de ligne ou tracked=false = illimité.
export const inventory = pgTable(
  "inventory",
  {
    id: id(),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "cascade" }),
    tracked: boolean("tracked").notNull().default(false),
    quantity: integer("quantity").notNull().default(0),
    // Valeur appliquée par « Réinitialiser le stock du jour ».
    dailyQuantity: integer("daily_quantity"),
    updatedAt: updatedAt(),
  },
  (t) => [unique("inventory_item_uq").on(t.productId, t.variantId).nullsNotDistinct()]
);

/* ---------- Campagnes saisonnières / événements ---------- */
export const events = pgTable("events", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  kind: text("kind").notNull().default("custom"),
  headline: text("headline"),
  subtitle: text("subtitle"),
  description: text("description"),
  heroImage: text("hero_image"),
  published: boolean("published").notNull().default(false),
  orderOpensAt: timestamp("order_opens_at", { withTimezone: true }),
  orderClosesAt: timestamp("order_closes_at", { withTimezone: true }),
  pickupStart: date("pickup_start"),
  pickupEnd: date("pickup_end"),
  // Liste explicite de dates de retrait autorisées (sinon toute la plage pickupStart → pickupEnd).
  pickupDates: jsonb("pickup_dates").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  maxOrders: integer("max_orders"),
  position: integer("position").notNull().default(0),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const eventProducts = pgTable(
  "event_products",
  {
    eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.eventId, t.productId] })]
);

/* ---------- Promotions ---------- */
export const promotions = pgTable("promotions", {
  id: id(),
  code: text("code").notNull().unique(),
  label: text("label").notNull(),
  type: text("type").$type<"percent" | "amount">().notNull(),
  value: integer("value").notNull(),
  minSubtotalCents: integer("min_subtotal_cents").notNull().default(0),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  maxUses: integer("max_uses"),
  uses: integer("uses").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
});

/* ---------- Commandes ---------- */
export const orders = pgTable(
  "orders",
  {
    id: id(),
    number: text("number").notNull().unique(),
    // Jeton non devinable permettant au client de suivre sa commande.
    accessToken: text("access_token").notNull(),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    kind: text("kind").$type<"click_collect" | "custom">().notNull().default("click_collect"),
    status: orderStatusEnum("status").notNull().default("new"),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    pickupDate: date("pickup_date").notNull(),
    pickupTime: text("pickup_time").notNull(),
    subtotalCents: integer("subtotal_cents").notNull(),
    discountCents: integer("discount_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    amountDueNowCents: integer("amount_due_now_cents").notNull().default(0),
    amountPaidCents: integer("amount_paid_cents").notNull().default(0),
    paymentMethod: text("payment_method").$type<"card" | "on_site">().notNull(),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
    promotionId: uuid("promotion_id").references(() => promotions.id, { onDelete: "set null" }),
    eventId: uuid("event_id").references(() => events.id, { onDelete: "set null" }),
    customerNote: text("customer_note"),
    internalNote: text("internal_note"),
    stockReleased: boolean("stock_released").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    readyAt: timestamp("ready_at", { withTimezone: true }),
    collectedAt: timestamp("collected_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  },
  (t) => [
    index("orders_pickup_idx").on(t.pickupDate, t.pickupTime),
    index("orders_customer_idx").on(t.customerId),
    index("orders_created_idx").on(t.createdAt),
    index("orders_event_idx").on(t.eventId),
  ]
);

export const orderItems = pgTable(
  "order_items",
  {
    id: id(),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    categoryName: text("category_name"),
    name: text("name").notNull(),
    variantLabel: text("variant_label"),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull(),
    vatRate: integer("vat_rate").notNull(),
    note: text("note"),
  },
  (t) => [index("order_items_order_idx").on(t.orderId), index("order_items_product_idx").on(t.productId)]
);

export const customOrders = pgTable(
  "custom_orders",
  {
    id: id(),
    number: text("number").notNull().unique(),
    accessToken: text("access_token").notNull(),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    // Commande Click & Collect créée lorsque le gâteau est payé / accepté.
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    status: customStatusEnum("status").notNull().default("pending"),
    mode: text("mode").$type<"quote" | "pay">().notNull(),
    occasion: text("occasion").notNull(),
    servings: text("servings").notNull(),
    cakeType: text("cake_type").notNull(),
    flavors: jsonb("flavors").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    message: text("message"),
    inspirationImage: text("inspiration_image"),
    desiredDate: date("desired_date").notNull(),
    desiredTime: text("desired_time"),
    comment: text("comment"),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    estimateCents: integer("estimate_cents"),
    quoteCents: integer("quote_cents"),
    depositPercent: integer("deposit_percent"),
    adminMessage: text("admin_message"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("custom_orders_date_idx").on(t.desiredDate)]
);

export const payments = pgTable(
  "payments",
  {
    id: id(),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    customOrderId: uuid("custom_order_id").references(() => customOrders.id, { onDelete: "set null" }),
    provider: text("provider").$type<"stripe" | "on_site" | "manual">().notNull(),
    kind: text("kind").$type<"full" | "deposit" | "balance">().notNull(),
    amountCents: integer("amount_cents").notNull(),
    status: text("status").$type<"pending" | "succeeded" | "failed" | "expired" | "refunded">().notNull(),
    stripeSessionId: text("stripe_session_id").unique(),
    stripePaymentIntent: text("stripe_payment_intent"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("payments_order_idx").on(t.orderId)]
);

/* ---------- Créneaux de retrait : exceptions au planning généré depuis les horaires ---------- */
export const pickupSlots = pgTable(
  "pickup_slots",
  {
    id: id(),
    date: date("date").notNull(),
    // null = journée entière
    time: text("time"),
    closed: boolean("closed").notNull().default(false),
    capacity: integer("capacity"),
    note: text("note"),
    createdAt: createdAt(),
  },
  (t) => [index("pickup_slots_date_idx").on(t.date)]
);

/* ---------- Notifications (email, SMS, WhatsApp, tableau de bord) ---------- */
export const notifications = pgTable(
  "notifications",
  {
    id: id(),
    channel: text("channel").$type<"email" | "sms" | "whatsapp" | "dashboard">().notNull(),
    audience: text("audience").$type<"customer" | "staff">().notNull(),
    type: text("type").notNull(),
    recipient: text("recipient"),
    subject: text("subject"),
    body: text("body"),
    status: text("status").$type<"queued" | "sent" | "failed" | "skipped">().notNull().default("queued"),
    error: text("error"),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }),
    customOrderId: uuid("custom_order_id").references(() => customOrders.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("notifications_created_idx").on(t.createdAt)]
);

/* ---------- Divers ---------- */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: updatedAt(),
});

export const media = pgTable("media", {
  id: id(),
  url: text("url").notNull(),
  alt: text("alt").notNull().default(""),
  caption: text("caption"),
  category: text("category").notNull().default("boutique"),
  format: text("format").notNull().default("landscape"),
  inGallery: boolean("in_gallery").notNull().default(true),
  position: integer("position").notNull().default(0),
  createdAt: createdAt(),
});

export const messages = pgTable("messages", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  subject: text("subject"),
  body: text("body").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: createdAt(),
});

/** Images stockées directement en base (aucun service de stockage externe nécessaire). */
const bytea = customType<{ data: Buffer; driverData: Buffer }>({ dataType: () => "bytea" });

export const files = pgTable("files", {
  id: id(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  // Public : produits, galerie, campagnes. Privé : photos envoyées par les clients.
  isPublic: boolean("is_public").notNull().default(true),
  data: bytea("data").notNull(),
  createdAt: createdAt(),
});

export const counters = pgTable("counters", {
  key: text("key").primaryKey(),
  value: integer("value").notNull().default(0),
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: id(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entity: text("entity"),
    entityId: text("entity_id"),
    data: jsonb("data"),
    createdAt: createdAt(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt)]
);

export type User = typeof users.$inferSelect;
export type Role = User["role"];
export type Customer = typeof customers.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderStatus = Order["status"];
export type PaymentStatus = Order["paymentStatus"];
export type CustomOrder = typeof customOrders.$inferSelect;
export type CustomStatus = CustomOrder["status"];
export type Event = typeof events.$inferSelect;
export type Promotion = typeof promotions.$inferSelect;
export type Media = typeof media.$inferSelect;
export type Notification = typeof notifications.$inferSelect;

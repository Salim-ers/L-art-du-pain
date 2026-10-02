/** Lecture du catalogue pour le site public : produits, formats, stock, campagnes. */
import { and, asc, eq, inArray, ne, sql } from "drizzle-orm";
import { getDb, schema as s } from "@/lib/db";
import type { Category, Event, Product } from "@/lib/db/schema";
import { campaignDates, campaignState, type CampaignState } from "@/lib/events";
import { getSetting } from "@/lib/settings";
import { isUploaded } from "@/content/photos";
import { demoCampaignPhotos, demoProductPhotos } from "@/content/demo-photos";

/** Photo affichée : celle de la gestion, sinon — pour une donnée d'exemple uniquement — une photo d'exemple. */
const exampleImage = (image: string | null, isDemo: boolean, photo: { src: string } | undefined) =>
  isUploaded(image) || !isDemo ? image : photo?.src ?? null;

/** Les données d'exemple (is_demo) ne sont visibles qu'en mode démonstration (Gestion → Paramètres). */
export async function demoVisible() {
  return (await getSetting("catalog")).demo;
}

export type VariantView = { id: string; label: string; servings: number | null; priceCents: number; stock: number | null };
export type ProductView = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  composition: string | null;
  image: string | null;
  priceCents: number;
  fromPrice: boolean;
  allergens: string[];
  category: { slug: string; name: string } | null;
  variants: VariantView[];
  stock: number | null;
  seasonal: boolean;
  featured: boolean;
  leadTimeHours: number;
  campaign: { id: string; slug: string; name: string; state: CampaignState; dates: string[] } | null;
  orderable: boolean;
  unavailable: string | null;
  // Quantité minimale par commande.
  minQuantity: number;
  // Donnée d'exemple : affichée avec une mention « Exemple », jamais présentée comme une vraie offre.
  demo: boolean;
};

export type CampaignView = Event & { state: CampaignState; dates: string[]; orderCount: number };

export async function eventOrderCounts(ids?: string[]) {
  const db = await getDb();
  const rows = await db
    .select({ eventId: s.orders.eventId, n: sql<number>`count(*)::int` })
    .from(s.orders)
    .where(and(ne(s.orders.status, "cancelled"), ids?.length ? inArray(s.orders.eventId, ids) : undefined))
    .groupBy(s.orders.eventId);
  return new Map(rows.map((r) => [r.eventId, r.n]));
}

export async function listCampaigns(opts: { publishedOnly?: boolean } = {}): Promise<CampaignView[]> {
  const db = await getDb();
  const hideDemo = opts.publishedOnly && !(await demoVisible());
  const rows = await db
    .select()
    .from(s.events)
    .where(and(opts.publishedOnly ? eq(s.events.published, true) : undefined, hideDemo ? eq(s.events.isDemo, false) : undefined))
    .orderBy(asc(s.events.position), asc(s.events.pickupStart));
  const counts = await eventOrderCounts(rows.map((r) => r.id));
  return rows.map((e) => {
    const n = counts.get(e.id) ?? 0;
    return { ...e, heroImage: exampleImage(e.heroImage, e.isDemo, demoCampaignPhotos[e.slug]), orderCount: n, state: campaignState(e, n), dates: campaignDates(e) };
  });
}

export async function getCampaign(slug: string) {
  const all = await listCampaigns();
  return all.find((c) => c.slug === slug) ?? null;
}

export async function listCategories(activeOnly = true): Promise<Category[]> {
  const db = await getDb();
  return db
    .select()
    .from(s.categories)
    .where(activeOnly ? eq(s.categories.active, true) : undefined)
    .orderBy(asc(s.categories.position), asc(s.categories.name));
}

export async function getCategory(slug: string) {
  const db = await getDb();
  const [c] = await db.select().from(s.categories).where(and(eq(s.categories.slug, slug), eq(s.categories.active, true)));
  return c ?? null;
}

type Filter = { categoryId?: string; ids?: string[]; slug?: string; featured?: boolean; campaignId?: string };

/** Produits actifs, enrichis de leurs formats, du stock et de la campagne éventuelle. */
export async function listProducts(f: Filter = {}): Promise<ProductView[]> {
  const db = await getDb();
  let productIds: string[] | undefined = f.ids;
  if (f.campaignId) {
    const links = await db
      .select()
      .from(s.eventProducts)
      .where(eq(s.eventProducts.eventId, f.campaignId))
      .orderBy(asc(s.eventProducts.position));
    productIds = links.map((l) => l.productId);
  }
  if (productIds && !productIds.length) return [];
  const showDemo = await demoVisible();

  const rows = await db
    .select({ p: s.products, c: s.categories })
    .from(s.products)
    .leftJoin(s.categories, eq(s.products.categoryId, s.categories.id))
    .where(
      and(
        eq(s.products.active, true),
        showDemo ? undefined : eq(s.products.isDemo, false),
        f.categoryId ? eq(s.products.categoryId, f.categoryId) : undefined,
        productIds ? inArray(s.products.id, productIds) : undefined,
        f.slug ? eq(s.products.slug, f.slug) : undefined,
        f.featured ? eq(s.products.featured, true) : undefined
      )
    )
    .orderBy(asc(s.categories.position), asc(s.products.position), asc(s.products.name));
  if (!rows.length) return [];

  const ids = rows.map((r) => r.p.id);
  const [variants, stock, links] = await Promise.all([
    db
      .select()
      .from(s.productVariants)
      .where(and(inArray(s.productVariants.productId, ids), eq(s.productVariants.active, true)))
      .orderBy(asc(s.productVariants.position)),
    db.select().from(s.inventory).where(inArray(s.inventory.productId, ids)),
    db.select().from(s.eventProducts).where(inArray(s.eventProducts.productId, ids)),
  ]);
  const campaigns = links.length ? await listCampaigns() : [];

  const views = rows.map(({ p, c }) => toView(p, c, variants, stock, links, campaigns));
  if (productIds) {
    const order = new Map(productIds.map((id, i) => [id, i]));
    views.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }
  return views;
}

function toView(
  p: Product,
  c: Category | null,
  variants: (typeof s.productVariants.$inferSelect)[],
  stock: (typeof s.inventory.$inferSelect)[],
  links: (typeof s.eventProducts.$inferSelect)[],
  campaigns: CampaignView[]
): ProductView {
  const stockOf = (variantId: string | null) => {
    const row = stock.find((x) => x.productId === p.id && x.variantId === variantId);
    return row?.tracked ? Math.max(0, row.quantity) : null;
  };
  const vs: VariantView[] = variants
    .filter((v) => v.productId === p.id)
    .map((v) => ({ id: v.id, label: v.label, servings: v.servings, priceCents: v.priceCents, stock: stockOf(v.id) }));

  const linked = campaigns.filter((e) => e.published && links.some((l) => l.productId === p.id && l.eventId === e.id));
  const campaign = linked.find((e) => e.state === "open") ?? linked[0] ?? null;

  let unavailable: string | null = null;
  if (!p.orderable || !p.clickCollect || (c && (!c.active || !c.clickCollect))) unavailable = "En boutique";
  else if (p.seasonal && !campaign) unavailable = "Hors saison";
  else if (p.seasonal && campaign && campaign.state !== "open")
    unavailable =
      campaign.state === "full" ? "Complet" : campaign.state === "upcoming" ? "Précommandes bientôt ouvertes" : "Précommandes terminées";
  else {
    const soldOut = vs.length ? vs.every((v) => v.stock === 0) : stockOf(null) === 0;
    if (soldOut) unavailable = "Épuisé";
  }

  const prices = vs.length ? vs.map((v) => v.priceCents) : [p.priceCents];
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortDescription: p.shortDescription,
    description: p.description,
    composition: p.composition,
    image: exampleImage(p.image, p.isDemo, demoProductPhotos[p.slug]),
    priceCents: Math.min(...prices),
    fromPrice: new Set(prices).size > 1,
    allergens: p.allergens,
    category: c ? { slug: c.slug, name: c.name } : null,
    variants: vs,
    stock: vs.length ? null : stockOf(null),
    seasonal: p.seasonal,
    featured: p.featured,
    leadTimeHours: p.leadTimeHours,
    campaign: campaign
      ? { id: campaign.id, slug: campaign.slug, name: campaign.name, state: campaign.state, dates: campaign.dates }
      : null,
    orderable: unavailable === null,
    unavailable,
    minQuantity: Math.max(1, p.minQuantity),
    demo: p.isDemo,
  };
}

export async function getProduct(slug: string) {
  const [p] = await listProducts({ slug });
  return p ?? null;
}

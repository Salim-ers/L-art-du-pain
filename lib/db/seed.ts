/**
 * Données initiales — exécutées une seule fois, sur une base vide.
 * Données réelles (familles, réglages) ici ; produits et campagnes d'exemple dans ./demo-data (marqués `is_demo`).
 */
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { defaultSettings } from "@/lib/settings-shared";
import type { DB } from "./index";
import * as s from "./schema";
import { demoProducts } from "./demo-data";

/**
 * DONNÉES RÉELLES — les familles de produits de la boutique (textes génériques, sans prix ni produit précis).
 * `clickCollect: false` : la famille est présentée, mais la commande en ligne reste fermée tant que la boutique ne l'ouvre pas.
 */
const families: { slug: string; name: string; tagline: string; description: string; seo: string; clickCollect: boolean }[] = [
  {
    slug: "pains",
    name: "Pains",
    tagline: "Baguettes, traditions et pains spéciaux.",
    description: "Le pain de tous les jours, à retrouver en boutique. Pour une grande quantité, faites-nous une demande.",
    clickCollect: false,
    seo: "Pains et baguettes à L’Art du Pain, boulangerie à Nogent-sur-Oise, près de Creil.",
  },
  {
    slug: "viennoiseries",
    name: "Viennoiseries",
    tagline: "Croissants, pains au chocolat, chaussons.",
    description: "Les viennoiseries du matin, à retrouver en boutique. Plateaux pour une réunion ou un petit-déjeuner : sur demande.",
    clickCollect: false,
    seo: "Viennoiseries à L’Art du Pain, Nogent-sur-Oise : croissants, pains au chocolat. Plateaux sur demande.",
  },
  {
    slug: "patisseries",
    name: "Pâtisseries",
    tagline: "Éclairs, tartes, entremets individuels.",
    description: "Les pâtisseries de la vitrine, à retrouver en boutique.",
    clickCollect: false,
    seo: "Pâtisseries à L’Art du Pain, Nogent-sur-Oise : éclairs, tartes, entremets individuels.",
  },
  {
    slug: "gateaux",
    name: "Gâteaux",
    tagline: "À partager, pour les occasions.",
    description: "Gâteaux à partager, sur commande. Pour un gâteau personnalisé, utilisez le configurateur.",
    clickCollect: true,
    seo: "Gâteaux d’anniversaire et gâteaux à partager à Nogent-sur-Oise, sur commande, retrait en boutique.",
  },
  {
    slug: "sale",
    name: "Salé",
    tagline: "Sandwichs, quiches, snacking.",
    description: "Le salé du midi, à retrouver en boutique. Buffets et grandes quantités : sur demande.",
    clickCollect: false,
    seo: "Sandwichs et snacking salé à L’Art du Pain, Nogent-sur-Oise. Buffets sur demande.",
  },
  {
    slug: "gourmandises",
    name: "Gourmandises",
    tagline: "Biscuits, petits gâteaux, chocolats.",
    description: "Les petites douceurs à offrir ou à s’offrir, à retrouver en boutique.",
    clickCollect: false,
    seo: "Gourmandises et chocolats à L’Art du Pain, Nogent-sur-Oise.",
  },
  {
    slug: "fetes",
    name: "Fêtes & saisons",
    tagline: "Noël, Épiphanie et créations de saison.",
    description: "Les créations des fêtes, à précommander pendant leur période d’ouverture.",
    clickCollect: true,
    seo: "Bûches de Noël et créations de fêtes à Nogent-sur-Oise : précommande en ligne, retrait en boutique.",
  },
];

const slugify = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export async function seed(db: DB) {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.categories);
  if (n > 0) return;

  await db.transaction(async (tx) => {
    const productIds: Record<string, string> = {};
    for (const [ci, c] of families.entries()) {
      const [cat] = await tx
        .insert(s.categories)
        .values({ slug: c.slug, name: c.name, tagline: c.tagline, description: c.description, position: ci, seoDescription: c.seo, clickCollect: c.clickCollect })
        .returning();
      for (const [pi, p] of (demoProducts[c.slug] ?? []).entries()) {
        const [prod] = await tx
          .insert(s.products)
          .values({
            slug: slugify(p.name),
            categoryId: cat.id,
            name: p.name,
            shortDescription: p.short ?? null,
            description: p.description ?? p.short ?? null,
            composition: p.composition ?? null,
            // Une photo = un seul sujet : un produit sans photo à lui reste sans photo (jamais celle de sa catégorie).
            image: p.image ?? null,
            priceCents: p.price,
            vatRate: p.vat ?? 550,
            allergens: p.allergens ?? [],
            featured: p.featured ?? false,
            seasonal: p.seasonal ?? false,
            leadTimeHours: p.lead ?? 0,
            isDemo: true,
            position: pi,
          })
          .returning();
        productIds[prod.slug] = prod.id;
        const variants = p.variants
          ? await tx
              .insert(s.productVariants)
              .values(p.variants.map(([label, servings, price], vi) => ({ productId: prod.id, label, servings, priceCents: price, position: vi })))
              .returning()
          : [];
        if (p.stock !== undefined) {
          const rows = variants.length
            ? variants.map((v) => ({ productId: prod.id, variantId: v.id, tracked: true, quantity: Math.round(p.stock! / variants.length), dailyQuantity: null }))
            : [{ productId: prod.id, variantId: null, tracked: true, quantity: p.stock, dailyQuantity: p.stock }];
          await tx.insert(s.inventory).values(rows);
        }
      }
    }

    const year = new Date().getFullYear();
    const [noel] = await tx
      .insert(s.events)
      .values({
        slug: "noel",
        name: "Noël " + year,
        kind: "noel",
        headline: "Nos créations de Noël",
        subtitle: "Des fêtes façonnées avec gourmandise.",
        description:
          "Exemple de campagne : une collection de fêtes à précommander en ligne et à retirer en boutique.",
        published: true,
        isDemo: true,
        orderOpensAt: new Date(Date.UTC(year, 10, 1, 7, 0)),
        orderClosesAt: new Date(Date.UTC(year, 11, 22, 18, 0)),
        pickupStart: `${year}-12-20`,
        pickupEnd: `${year}-12-31`,
        pickupDates: [20, 21, 22, 23, 24, 29, 30, 31].map((d) => `${year}-12-${d}`),
        maxOrders: 250,
        seoTitle: "Bûche de Noël à Nogent-sur-Oise — précommande",
        seoDescription:
          "Précommandez votre bûche de Noël artisanale à L’Art du Pain, Nogent-sur-Oise : chocolat praliné, vanille fruits rouges, pistache griotte. Retrait en boutique.",
      })
      .returning();
    const buches = ["buche-chocolat-praline", "buche-vanille-fruits-rouges", "buche-pistache-griotte", "buche-traditionnelle-cafe"];
    await tx.insert(s.eventProducts).values(buches.map((slug, i) => ({ eventId: noel.id, productId: productIds[slug], position: i })));

    const [epi] = await tx
      .insert(s.events)
      .values({
        slug: "epiphanie",
        name: "Épiphanie " + (year + 1),
        kind: "epiphanie",
        headline: "Galettes des rois",
        subtitle: "Feuilletage pur beurre, fève et couronne.",
        description: "Pour l’Épiphanie, nos galettes frangipane sont à réserver en ligne et à retirer en boutique.",
        published: false,
        isDemo: true,
        orderOpensAt: new Date(Date.UTC(year, 11, 26, 7, 0)),
        orderClosesAt: new Date(Date.UTC(year + 1, 0, 31, 18, 0)),
        pickupStart: `${year + 1}-01-02`,
        pickupEnd: `${year + 1}-01-31`,
      })
      .returning();
    await tx.insert(s.eventProducts).values({ eventId: epi.id, productId: productIds["galette-des-rois-frangipane"], position: 0 });

    // Galerie : vraies photos de la boutique, non utilisées ailleurs sur le site.
    const gallery: [string, string, string, string][] = [
      ["/images/religieuse.png", "Religieuse au chocolat de L’Art du Pain", "La religieuse", "patisseries"],
    ];
    const formats = ["square"];
    await tx.insert(s.media).values(gallery.map(([url, alt, caption, category], i) => ({ url, alt, caption, category, format: formats[i], position: i })));

    await tx.insert(s.settings).values(Object.entries(defaultSettings).map(([key, value]) => ({ key, value })));

  });
}

/**
 * Compte super administrateur défini par ADMIN_EMAIL / ADMIN_PASSWORD (variables Vercel) :
 * créé s'il n'existe pas encore, même si la base a démarré avant l'ajout des variables.
 * ADMIN_RESET_PASSWORD=1 réapplique le mot de passe au redémarrage (à retirer ensuite).
 * En local sans variables : admin@lartdupain.local / boulangerie-dev.
 */
export const adminEnv = () => ({
  email: process.env.ADMIN_EMAIL?.trim().toLowerCase() || null,
  password: process.env.ADMIN_PASSWORD?.trim() || null,
});

export async function ensureAdmin(db: DB) {
  const { email, password } = adminEnv();
  if (email && password) {
    const [existing] = await db.select().from(s.users).where(eq(s.users.email, email));
    if (!existing) {
      await db.insert(s.users).values({ email, name: "Administrateur", passwordHash: await bcrypt.hash(password, 12), role: "SUPER_ADMIN" }).onConflictDoNothing();
    } else if (process.env.ADMIN_RESET_PASSWORD === "1") {
      await db
        .update(s.users)
        .set({ passwordHash: await bcrypt.hash(password, 12), active: true, role: "SUPER_ADMIN", tokenVersion: existing.tokenVersion + 1 })
        .where(eq(s.users.id, existing.id));
    }
    return;
  }
  if (process.env.NODE_ENV === "production") return;
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.users);
  if (n === 0) {
    await db.insert(s.users).values({ email: "admin@lartdupain.local", name: "Administrateur", passwordHash: await bcrypt.hash("boulangerie-dev", 12), role: "SUPER_ADMIN" }).onConflictDoNothing();
  }
}

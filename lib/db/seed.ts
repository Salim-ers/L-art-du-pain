/**
 * Données initiales — exécutées une seule fois, sur une base vide.
 * ⚠️ Catalogue et prix de DÉMONSTRATION : à vérifier / remplacer par la Maison depuis /admin avant la mise en ligne.
 */
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { defaultSettings } from "@/lib/settings-shared";
import type { DB } from "./index";
import * as s from "./schema";

type SeedProduct = {
  name: string;
  price: number;
  short?: string;
  description?: string;
  composition?: string;
  image?: string | null;
  allergens?: string[];
  variants?: [label: string, servings: number, price: number][];
  featured?: boolean;
  seasonal?: boolean;
  lead?: number;
  stock?: number;
  vat?: number;
};

const G = "Gluten", L = "Lait", O = "Œufs", N = "Fruits à coque", SO = "Soja", SE = "Sésame", M = "Moutarde";

const catalog: { slug: string; name: string; tagline: string; description: string; image: string | null; seo: string; products: SeedProduct[] }[] = [
  {
    slug: "pains",
    name: "Pains",
    tagline: "La croûte qui chante, la mie qui respire.",
    description: "Baguettes, traditions et pains spéciaux cuits plusieurs fois par jour dans notre fournil de Nogent-sur-Oise.",
    image: "/images/pains.png",
    seo: "Pains artisanaux cuits chaque jour à Nogent-sur-Oise : baguette tradition, pain de campagne, pain complet. Réservez en Click & Collect.",
    products: [
      { name: "Baguette tradition", price: 140, short: "Farine Label Rouge, fermentation lente, croûte fine et craquante.", image: "/images/pains.png", allergens: [G], featured: true },
      { name: "Baguette", price: 120, short: "La baguette du quotidien, dorée à point.", allergens: [G] },
      { name: "Pain complet", price: 260, short: "Farine complète, mie dense et parfumée.", allergens: [G] },
      { name: "Pain aux céréales", price: 290, short: "Graines de lin, tournesol, sésame et millet.", allergens: [G, SE] },
      { name: "Pain de campagne", price: 320, short: "Au levain, pour les tartines et les belles tablées.", allergens: [G] },
    ],
  },
  {
    slug: "viennoiseries",
    name: "Viennoiseries",
    tagline: "Feuilletées au beurre, chaque matin.",
    description: "Croissants, pains au chocolat et chaussons façonnés à la main, au beurre, dès l’aube.",
    image: "/images/viennoiseries.png",
    seo: "Viennoiseries pur beurre à Nogent-sur-Oise : croissants, pains au chocolat, pains aux raisins. Commandez et retirez en boutique.",
    products: [
      { name: "Croissant", price: 130, short: "Pur beurre, feuilletage croustillant.", image: "/images/viennoiseries.png", allergens: [G, L, O], featured: true, stock: 60 },
      { name: "Pain au chocolat", price: 140, short: "Deux barres de chocolat noir, feuilletage doré.", image: "/images/viennoiseries.png", allergens: [G, L, O, SO], stock: 60 },
      { name: "Pain aux raisins", price: 170, short: "Crème pâtissière et raisins moelleux.", allergens: [G, L, O] },
      { name: "Chausson aux pommes", price: 180, short: "Compotée de pommes, feuilletage caramélisé.", allergens: [G, L, O] },
    ],
  },
  {
    slug: "patisseries",
    name: "Pâtisseries",
    tagline: "Les classiques, avec exigence.",
    description: "Éclairs, religieuses, tartes et entremets individuels, préparés chaque jour par nos pâtissiers.",
    image: "/images/patisseries-vitrine.png",
    seo: "Pâtisserie à Nogent-sur-Oise : éclairs, religieuses, tartes, mille-feuilles et Paris-Brest faits maison. Click & Collect.",
    products: [
      { name: "Religieuse chocolat", price: 360, short: "Pâte à choux, crème onctueuse, glaçage chocolat.", description: "La signature de la Maison : deux choux garnis d’une crème pâtissière au chocolat, glaçage brillant, collerette de crème au beurre.", image: "/images/religieuse.png", allergens: [G, L, O], featured: true },
      { name: "Éclair chocolat", price: 320, short: "Crème pâtissière chocolat noir.", allergens: [G, L, O] },
      { name: "Tarte au citron", price: 380, short: "Sablé breton, crémeux citron, meringue italienne.", allergens: [G, L, O] },
      { name: "Mille-feuille", price: 390, short: "Feuilletage caramélisé, crème vanille.", allergens: [G, L, O] },
      { name: "Paris-Brest", price: 420, short: "Choux croustillant, crème mousseline pralinée.", allergens: [G, L, O, N] },
      { name: "Entremets individuel", price: 450, short: "Création du moment, selon la saison.", image: "/images/entremets-coeur.png", allergens: [G, L, O] },
    ],
  },
  {
    slug: "gateaux",
    name: "Gâteaux",
    tagline: "À partager, pour les grandes occasions.",
    description: "Entremets et gâteaux à partager, de 4 à 8 personnes. Pour un gâteau sur mesure, utilisez notre configurateur.",
    image: "/images/patisseries-collection.png",
    seo: "Gâteaux d’anniversaire et entremets à partager à Nogent-sur-Oise, de 4 à 8 personnes. Commande en ligne et retrait en boutique.",
    products: [
      { name: "Entremets chocolat", price: 2400, short: "Mousse chocolat noir, croustillant praliné.", image: "/images/entremets-coeur.png", allergens: [G, L, O, N], variants: [["4 personnes", 4, 1800], ["6 personnes", 6, 2400], ["8 personnes", 8, 3200]], lead: 24 },
      { name: "Fraisier", price: 2600, short: "Génoise, crème mousseline, fraises fraîches (en saison).", allergens: [G, L, O], variants: [["4 personnes", 4, 2000], ["6 personnes", 6, 2600], ["8 personnes", 8, 3400]], lead: 24 },
      { name: "Tarte aux fruits de saison", price: 2200, short: "Pâte sablée, crème d’amande, fruits frais.", image: "/images/patisseries-collection.png", allergens: [G, L, O, N], variants: [["6 personnes", 6, 2200], ["8 personnes", 8, 2900]], lead: 24 },
    ],
  },
  {
    slug: "sale",
    name: "Salé",
    tagline: "Pour le déjeuner, sur le pouce.",
    description: "Sandwichs sur pain maison, paninis, quiches et pizzas, préparés chaque jour.",
    image: "/images/sale.png",
    seo: "Sandwichs, paninis, quiches et formules déjeuner à Nogent-sur-Oise, préparés sur notre pain maison. Réservez votre déjeuner.",
    products: [
      { name: "Sandwich jambon-beurre", price: 450, short: "Baguette tradition, jambon supérieur, beurre doux.", image: "/images/sale.png", allergens: [G, L], vat: 1000 },
      { name: "Panini", price: 500, short: "Jambon, fromage ou poulet curry.", allergens: [G, L, M], vat: 1000 },
      { name: "Quiche lorraine", price: 380, short: "Pâte brisée maison, lardons, crème.", allergens: [G, L, O], vat: 1000 },
      { name: "Pizza", price: 350, short: "Sur pâte à pain, garniture du jour.", allergens: [G, L], vat: 1000 },
      { name: "Formule déjeuner", price: 890, short: "Sandwich ou salade + boisson + dessert.", allergens: [G, L, O], vat: 1000 },
    ],
  },
  {
    slug: "gourmandises",
    name: "Gourmandises",
    tagline: "Les petits plaisirs de la Maison.",
    description: "Cookies, brownies, financiers et chocolats, à offrir ou à s’offrir.",
    image: "/images/entremets-coeur.png",
    seo: "Gourmandises artisanales à Nogent-sur-Oise : cookies, brownies, financiers et chocolats. À offrir ou à déguster.",
    products: [
      { name: "Cookie", price: 220, short: "Pépites de chocolat, cœur fondant.", allergens: [G, L, O, SO] },
      { name: "Brownie", price: 260, short: "Chocolat noir et noix de pécan.", allergens: [G, L, O, N] },
      { name: "Financier", price: 120, short: "Beurre noisette et poudre d’amande.", allergens: [G, L, O, N] },
      { name: "Ballotin de chocolats", price: 1800, short: "Assortiment de la Maison, 250 g.", allergens: [L, N, SO], vat: 2000 },
    ],
  },
  {
    slug: "fetes",
    name: "Fêtes & saisons",
    tagline: "Les créations des grands rendez-vous.",
    description: "Bûches de Noël, galettes des rois et créations de saison, disponibles pendant nos campagnes de précommande.",
    image: null,
    seo: "Bûches de Noël et créations de fêtes à Nogent-sur-Oise. Précommandez en ligne et retirez en boutique.",
    products: [
      {
        name: "Bûche Chocolat Praliné",
        price: 3900,
        short: "Mousse chocolat noir, cœur praliné, croustillant noisette.",
        description: "Une mousse au chocolat noir intense, un cœur praliné coulant et un croustillant aux noisettes torréfiées. Décor chocolat façonné à la main.",
        composition: "Biscuit chocolat, croustillant praliné noisette, crémeux praliné, mousse chocolat noir 64 %, glaçage cacao.",
        allergens: [G, L, O, N, SO],
        variants: [["4 personnes", 4, 2800], ["6 personnes", 6, 3900], ["8 personnes", 8, 5200]],
        seasonal: true,
        lead: 48,
        stock: 40,
      },
      {
        name: "Bûche Vanille Fruits rouges",
        price: 3900,
        short: "Mousse vanille de Madagascar, insert fruits rouges.",
        composition: "Biscuit amande, compotée de framboises et griottes, mousse vanille, glaçage blanc.",
        allergens: [G, L, O, N],
        variants: [["4 personnes", 4, 2800], ["6 personnes", 6, 3900], ["8 personnes", 8, 5200]],
        seasonal: true,
        lead: 48,
        stock: 30,
      },
      {
        name: "Bûche Pistache Griotte",
        price: 4200,
        short: "Mousse pistache, cœur griotte, sablé croustillant.",
        composition: "Sablé breton, crémeux pistache, confit de griottes, mousse pistache.",
        allergens: [G, L, O, N],
        variants: [["4 personnes", 4, 3000], ["6 personnes", 6, 4200], ["8 personnes", 8, 5600]],
        seasonal: true,
        lead: 48,
        stock: 25,
      },
      {
        name: "Bûche traditionnelle Café",
        price: 3600,
        short: "Biscuit roulé, crème au beurre café.",
        allergens: [G, L, O],
        variants: [["4 personnes", 4, 2600], ["6 personnes", 6, 3600], ["8 personnes", 8, 4800]],
        seasonal: true,
        lead: 48,
      },
      {
        name: "Galette des rois frangipane",
        price: 2200,
        short: "Feuilletage pur beurre, frangipane amande.",
        allergens: [G, L, O, N],
        variants: [["4 personnes", 4, 1600], ["6 personnes", 6, 2200], ["8 personnes", 8, 2900]],
        seasonal: true,
        lead: 24,
      },
    ],
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
    for (const [ci, c] of catalog.entries()) {
      const [cat] = await tx
        .insert(s.categories)
        .values({ slug: c.slug, name: c.name, tagline: c.tagline, description: c.description, image: c.image, position: ci, seoDescription: c.seo })
        .returning();
      for (const [pi, p] of c.products.entries()) {
        const [prod] = await tx
          .insert(s.products)
          .values({
            slug: slugify(p.name),
            categoryId: cat.id,
            name: p.name,
            shortDescription: p.short ?? null,
            description: p.description ?? p.short ?? null,
            composition: p.composition ?? null,
            image: p.image === undefined ? c.image : p.image,
            priceCents: p.price,
            vatRate: p.vat ?? 550,
            allergens: p.allergens ?? [],
            featured: p.featured ?? false,
            seasonal: p.seasonal ?? false,
            leadTimeHours: p.lead ?? 0,
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
          "Bûches pâtissières, chocolat, fruits et praliné : pour les fêtes, la Maison prépare une collection éphémère, à précommander en ligne et à retirer en boutique à Nogent-sur-Oise.",
        published: true,
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
        orderOpensAt: new Date(Date.UTC(year, 11, 26, 7, 0)),
        orderClosesAt: new Date(Date.UTC(year + 1, 0, 31, 18, 0)),
        pickupStart: `${year + 1}-01-02`,
        pickupEnd: `${year + 1}-01-31`,
      })
      .returning();
    await tx.insert(s.eventProducts).values({ eventId: epi.id, productId: productIds["galette-des-rois-frangipane"], position: 0 });

    const gallery: [string, string, string, string][] = [
      ["/images/boutique-interieur.png", "Intérieur de la boutique", "L’intérieur", "boutique"],
      ["/images/pains.png", "Baguettes dorées", "Les pains", "pains"],
      ["/images/patisseries-collection.png", "Plateau de pâtisseries", "La collection", "patisseries"],
      ["/images/viennoiseries.png", "Croissants et pains au chocolat", "Viennoiseries", "viennoiseries"],
      ["/images/sale.png", "Snacking salé", "Le salé", "boutique"],
      ["/images/religieuse.png", "Religieuse au chocolat", "La Religieuse", "patisseries"],
      ["/images/patisseries-vitrine.png", "Vitrine de pâtisseries", "La vitrine", "patisseries"],
      ["/images/entremets-coeur.png", "Entremets en forme de cœur", "L’entremets cœur", "evenements"],
      ["/images/boutique.png", "La boutique L’Art du Pain", "La boutique", "boutique"],
    ];
    const formats = ["wide", "portrait", "wide", "landscape", "medium", "square", "landscape", "portrait", "wide"];
    await tx.insert(s.media).values(gallery.map(([url, alt, caption, category], i) => ({ url, alt, caption, category, format: formats[i], position: i })));

    await tx.insert(s.settings).values(Object.entries(defaultSettings).map(([key, value]) => ({ key, value })));

  });
}

/** Premier compte super administrateur (ADMIN_EMAIL / ADMIN_PASSWORD), créé tant qu'aucun compte n'existe. */
export async function ensureAdmin(db: DB) {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.users);
  if (n > 0) return;
  const email = (process.env.ADMIN_EMAIL || "admin@lartdupain.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? null : "boulangerie-dev");
  if (!password) return;
  await db.insert(s.users).values({ email, name: "Administrateur", passwordHash: await bcrypt.hash(password, 12), role: "SUPER_ADMIN" }).onConflictDoNothing();
}

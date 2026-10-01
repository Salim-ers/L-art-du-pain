/** Données partagées par les pages publiques (avis, cartes de commande). */
import { and, eq } from "drizzle-orm";
import { site } from "@/content/site";
import { getDb, schema as s } from "@/lib/db";
import { listCampaigns, listCategories, type CampaignView } from "@/lib/catalog";
import { getSetting } from "@/lib/settings";
import type { QuickCard } from "@/components/shop/QuickOrder";

export const galleryFilters = [
  { id: "tout", label: "Tout" },
  { id: "pains", label: "Pains" },
  { id: "viennoiseries", label: "Viennoiseries" },
  { id: "patisseries", label: "Pâtisseries" },
  { id: "boutique", label: "Boutique" },
  { id: "evenements", label: "Événements" },
];

export async function getReviews() {
  const r = await getSetting("reviews");
  return { items: r.items, url: r.googleReviewUrl || site.links.review };
}

/** Campagne mise en avant : ouverte en priorité, sinon prochaine publiée. */
export async function featuredCampaign(): Promise<CampaignView | null> {
  const all = await listCampaigns({ publishedOnly: true });
  return all.find((c) => c.state === "open") ?? all.find((c) => c.state === "upcoming") ?? null;
}

export async function quickCards(): Promise<QuickCard[]> {
  const cats = await listCategories();
  const campaign = await featuredCampaign();
  const cards: QuickCard[] = cats
    .filter((c) => c.slug !== "fetes")
    .map((c) => ({ href: "/commander/" + c.slug, title: c.name, tagline: c.tagline, image: c.image }));
  const fetes = cats.find((c) => c.slug === "fetes");
  cards.push({
    href: campaign ? (campaign.kind === "noel" ? "/noel" : "/evenements/" + campaign.slug) : "/evenements",
    title: "Fêtes & Noël",
    tagline: campaign ? campaign.subtitle ?? fetes?.tagline ?? null : fetes?.tagline ?? "Les créations des grands rendez-vous.",
    image: campaign?.heroImage ?? fetes?.image ?? null,
    accent: true,
  });
  cards.push({ href: "/gateaux-sur-mesure", title: "Commande personnalisée", tagline: "Un gâteau à votre image.", image: null });
  return cards;
}

export async function activeCategory(slug: string) {
  const db = await getDb();
  const [c] = await db.select().from(s.categories).where(and(eq(s.categories.slug, slug), eq(s.categories.active, true)));
  return c ?? null;
}

/** Données partagées par les pages publiques (galerie, avis, cartes de commande). */
import { and, asc, eq } from "drizzle-orm";
import { site } from "@/content/site";
import { getDb, schema as s } from "@/lib/db";
import { listCampaigns, type CampaignView } from "@/lib/catalog";
import { getSetting } from "@/lib/settings";

export const galleryFilters = [
  { id: "tout", label: "Tout" },
  { id: "pains", label: "Pains" },
  { id: "viennoiseries", label: "Viennoiseries" },
  { id: "patisseries", label: "Pâtisseries" },
  { id: "boutique", label: "Boutique" },
  { id: "evenements", label: "Événements" },
];

export async function getGallery() {
  const db = await getDb();
  return db.select().from(s.media).where(eq(s.media.inGallery, true)).orderBy(asc(s.media.position), asc(s.media.createdAt));
}

export async function getReviews() {
  const r = await getSetting("reviews");
  return { items: r.items, url: r.googleReviewUrl || site.links.review };
}

/** Campagne mise en avant : ouverte en priorité, sinon prochaine publiée. */
export async function featuredCampaign(): Promise<CampaignView | null> {
  const all = await listCampaigns({ publishedOnly: true });
  return all.find((c) => c.state === "open") ?? all.find((c) => c.state === "upcoming") ?? null;
}

export async function activeCategory(slug: string) {
  const db = await getDb();
  const [c] = await db.select().from(s.categories).where(and(eq(s.categories.slug, slug), eq(s.categories.active, true)));
  return c ?? null;
}

/** Données partagées par les pages publiques (galerie, avis, cartes de commande). */
import { and, asc, eq } from "drizzle-orm";
import { site } from "@/content/site";
import { getDb, schema as s } from "@/lib/db";
import { listCampaigns, type CampaignView } from "@/lib/catalog";
import { getSetting } from "@/lib/settings";
import { googleReviews, googleSnapshot } from "@/content/google-reviews";

export const galleryFilters = [
  { id: "tout", label: "Tout" },
  { id: "pains", label: "Pains" },
  { id: "viennoiseries", label: "Viennoiseries" },
  { id: "patisseries", label: "Pâtisseries" },
  { id: "boutique", label: "Boutique" },
  { id: "evenements", label: "Événements" },
];

// Anciennes vignettes (moins de 400 px de large) : floues une fois agrandies, jamais affichées dans la galerie.
const LOW_RES = new Set(["/images/pains.png", "/images/viennoiseries.png", "/images/patisseries-vitrine.png"]);

export async function getGallery() {
  const db = await getDb();
  const rows = await db.select().from(s.media).where(eq(s.media.inGallery, true)).orderBy(asc(s.media.position), asc(s.media.createdAt));
  return rows.filter((m) => !LOW_RES.has(m.url));
}

/**
 * Avis affichés : ceux saisis dans la gestion, sinon le relevé d'avis Google réels (content/google-reviews.ts).
 * `own` : avis saisis par la boutique — seuls ceux-là peuvent figurer dans les données structurées.
 */
export async function getReviews() {
  const r = await getSetting("reviews");
  const own = r.items.length > 0;
  return {
    items: own ? r.items : googleReviews,
    url: r.googleReviewUrl || site.links.review,
    own,
    summary: own ? null : googleSnapshot,
  };
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

import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { listCampaigns, listCategories, listProducts } from "@/lib/catalog";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const page = (path: string, priority: number, changeFrequency: "daily" | "weekly" | "monthly" | "yearly" = "weekly") => ({ url: site.url + path, lastModified: now, changeFrequency, priority });
  const [categories, products, campaigns] = await Promise.all([listCategories(), listProducts(), listCampaigns({ publishedOnly: true })]);
  return [
    page("/", 1, "daily"),
    page("/commander", 0.9, "daily"),
    page("/gateaux-sur-mesure", 0.9),
    page("/noel", 0.8),
    page("/nous-trouver", 0.8, "monthly"),
    page("/nos-creations", 0.7),
    page("/la-maison", 0.6, "monthly"),
    page("/savoir-faire", 0.5, "monthly"),
    page("/galerie", 0.5),
    page("/evenements", 0.6),
    ...categories.filter((c) => c.slug !== "fetes").map((c) => page("/commander/" + c.slug, 0.7)),
    ...products.map((p) => ({ ...page("/produit/" + p.slug, 0.6), lastModified: now })),
    ...campaigns.filter((c) => c.kind !== "noel" && c.state !== "closed").map((c) => page("/evenements/" + c.slug, 0.6)),
    page("/cgv", 0.1, "yearly"),
    page("/mentions-legales", 0.1, "yearly"),
    page("/confidentialite", 0.1, "yearly"),
  ];
}

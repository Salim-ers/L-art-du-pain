import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: site.url + "/", lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: site.url + "/mentions-legales", lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: site.url + "/confidentialite", lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}

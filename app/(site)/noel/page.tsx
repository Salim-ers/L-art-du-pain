import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CampaignPage } from "@/components/CampaignPage";
import { christmasFaq } from "@/content/faq";
import { listCampaigns, listProducts } from "@/lib/catalog";

/** Campagne de Noël publiée : ouverte en priorité, sinon la plus récente. */
async function christmas() {
  const all = (await listCampaigns({ publishedOnly: true })).filter((c) => c.kind === "noel");
  return all.find((c) => c.state === "open") ?? all.find((c) => c.state === "upcoming") ?? all[all.length - 1] ?? null;
}

// Servie par le CDN, régénérée en arrière-plan (au plus 60 s) et dès qu’une modification est faite dans la gestion.
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const c = await christmas();
  return {
    title: c?.seoTitle ?? "Bûche de Noël à Nogent-sur-Oise — précommande",
    description:
      c?.seoDescription ??
      "Les créations de Noël de L’Art du Pain à Nogent-sur-Oise, à précommander en ligne et à retirer en boutique pendant les fêtes.",
    alternates: { canonical: "/noel" },
    // Campagne d'exemple : jamais proposée aux moteurs de recherche.
    ...(c?.isDemo ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function NoelPage() {
  const c = await christmas();
  if (!c) notFound();
  const products = await listProducts({ campaignId: c.id });
  return <CampaignPage campaign={c} products={products} path="/noel" faq={christmasFaq} />;
}

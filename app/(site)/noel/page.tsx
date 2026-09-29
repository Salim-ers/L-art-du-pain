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

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const c = await christmas();
  return {
    title: c?.seoTitle ?? "Bûche de Noël à Nogent-sur-Oise — précommande",
    description:
      c?.seoDescription ??
      "Précommandez votre bûche de Noël artisanale chez L’Art du Pain à Nogent-sur-Oise. Chocolat, praliné, fruits : retrait en boutique pendant les fêtes.",
    alternates: { canonical: "/noel" },
  };
}

export default async function NoelPage() {
  const c = await christmas();
  if (!c) notFound();
  const products = await listProducts({ campaignId: c.id });
  return <CampaignPage campaign={c} products={products} path="/noel" faq={christmasFaq} />;
}

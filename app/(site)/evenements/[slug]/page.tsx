import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CampaignPage } from "@/components/CampaignPage";
import { getCampaign, listProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getCampaign(params.slug);
  if (!c || !c.published) return {};
  return {
    title: c.seoTitle ?? `${c.name} — L’Art du Pain, Nogent-sur-Oise`,
    description: c.seoDescription ?? c.description ?? undefined,
    alternates: { canonical: "/evenements/" + c.slug },
  };
}

export default async function EventPage({ params }: Props) {
  if (params.slug === "noel") redirect("/noel");
  const c = await getCampaign(params.slug);
  if (!c || !c.published) notFound();
  const products = await listProducts({ campaignId: c.id });
  return <CampaignPage campaign={c} products={products} path={"/evenements/" + c.slug} />;
}

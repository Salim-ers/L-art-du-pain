import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CampaignPage } from "@/components/CampaignPage";
import { getCampaign, listProducts } from "@/lib/catalog";

// Servie par le CDN, régénérée en arrière-plan (au plus 60 s) et dès qu’une modification est faite dans la gestion.
export const revalidate = 60;
// Aucune page générée au build : chacune est créée à sa première visite, puis servie depuis le cache.
export const generateStaticParams = async () => [];

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getCampaign(params.slug);
  if (!c || !c.published) return {};
  return {
    title: c.seoTitle ?? `${c.name} — L’Art du Pain, Nogent-sur-Oise`,
    description: c.seoDescription ?? c.description ?? undefined,
    alternates: { canonical: "/evenements/" + c.slug },
    // Campagne d'exemple : jamais proposée aux moteurs de recherche.
    ...(c?.isDemo ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function EventPage({ params }: Props) {
  if (params.slug === "noel") redirect("/noel");
  const c = await getCampaign(params.slug);
  if (!c || !c.published) notFound();
  const products = await listProducts({ campaignId: c.id });
  return <CampaignPage campaign={c} products={products} path={"/evenements/" + c.slug} />;
}

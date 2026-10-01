import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { ProductImage } from "@/components/shop/ProductImage";
import { pickupWindow } from "@/components/Teasers";
import { listCampaigns } from "@/lib/catalog";
import { campaignStateLabel } from "@/lib/events";

// Servie par le CDN, régénérée en arrière-plan (au plus 60 s) et dès qu’une modification est faite dans la gestion.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Événements et fêtes — Noël, Épiphanie, Pâques à Nogent-sur-Oise",
  description:
    "Les créations de fêtes de L’Art du Pain à Nogent-sur-Oise, à précommander en ligne et à retirer en boutique.",
  alternates: { canonical: "/evenements" },
};

export default async function EventsPage() {
  const campaigns = (await listCampaigns({ publishedOnly: true })).filter((c) => c.state !== "closed");
  return (
    <main id="contenu">
      <PageHero
        crumbs={[{ name: "Événements", path: "/evenements" }]}
        label="Au fil des saisons"
        title={["Les grands", <span key="i" className="it accent">rendez-vous.</span>]}
        intro={<p>Quand une collection de fêtes s’ouvre à la précommande, elle apparaît ici, avec ses dates de retrait.</p>}
      >
        <Link href="/commandes-speciales" className="btn btn--dark">Préparer mon événement</Link>
      </PageHero>
      <section className="section events">
        <div className="wrap events-grid">
          {campaigns.map((c, i) => (
            <Reveal key={c.id} as="article" className="event-card" delay={i * 0.08}>
              <Link href={c.kind === "noel" ? "/noel" : "/evenements/" + c.slug} className="event-link">
                <span className="event-media"><ProductImage src={c.heroImage} alt={c.name} sizes="(min-width: 900px) 50vw, 100vw" tone="dark" /></span>
                <span className="event-state">{campaignStateLabel[c.state]}</span>
                <span className="event-name">{c.headline ?? c.name}</span>
                {c.subtitle && <span className="event-sub">{c.subtitle}</span>}
                {pickupWindow(c) && <span className="event-window">{pickupWindow(c)}</span>}
              </Link>
            </Reveal>
          ))}
          {!campaigns.length && <p className="body">Aucune précommande ouverte pour le moment.</p>}
        </div>
      </section>
    </main>
  );
}

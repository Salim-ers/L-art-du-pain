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
    "Les rendez-vous gourmands de L’Art du Pain à Nogent-sur-Oise : bûches de Noël, galettes des rois, créations de Pâques, Saint-Valentin et fêtes. Précommande en ligne.",
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
        intro={<p>Noël, Épiphanie, Saint-Valentin, Pâques, Ramadan et Aïd, fête des mères et des pères : pour chaque temps fort, la Maison imagine une collection éphémère à précommander.</p>}
      >
        <Link href="/gateaux-sur-mesure" className="btn btn--dark">Un événement privé ? Gâteau sur mesure</Link>
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
          {!campaigns.length && <p className="body">Aucune campagne en cours. Revenez bientôt, ou composez votre gâteau sur mesure.</p>}
        </div>
      </section>
    </main>
  );
}

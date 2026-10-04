import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { ProductImage } from "@/components/shop/ProductImage";
import { pickupWindow } from "@/components/Teasers";
import { listCampaigns, type CampaignView } from "@/lib/catalog";
import { campaignStateLabel } from "@/lib/events";

// Servie par le CDN, régénérée en arrière-plan (au plus 60 s) et dès qu’une modification est faite dans la gestion.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Événements et fêtes — Noël, Épiphanie, Pâques à Nogent-sur-Oise",
  description:
    "Les créations de fêtes de L’Art du Pain à Nogent-sur-Oise, à précommander en ligne et à retirer en boutique.",
  alternates: { canonical: "/evenements" },
};

const href = (c: CampaignView) => (c.kind === "noel" ? "/noel" : "/evenements/" + c.slug);

/** Carte d'une campagne : photo, état des précommandes, titre, dates de retrait. */
function EventLink({ c, sizes }: { c: CampaignView; sizes: string }) {
  const range = pickupWindow(c);
  return (
    <Link href={href(c)} className="event-link">
      <span className="event-media"><ProductImage src={c.heroImage} alt={c.name} sizes={sizes} tone="dark" /></span>
      <span className="event-state">{campaignStateLabel[c.state]}</span>
      <span className="event-name">{c.headline ?? c.name}</span>
      {c.subtitle && <span className="event-sub">{c.subtitle}</span>}
      {range && <span className="event-window">{range}</span>}
    </Link>
  );
}

/**
 * La campagne mise en avant occupe la droite de l'en-tête ; les suivantes s'étendent sur toute la largeur.
 * Sans campagne publiée, un panneau l'indique : la page ne présente jamais de vide.
 */
export default async function EventsPage() {
  const [featured, ...others] = (await listCampaigns({ publishedOnly: true })).filter((c) => c.state !== "closed");
  return (
    <main id="contenu">
      <PageHero
        crumbs={[{ name: "Événements", path: "/evenements" }]}
        label="Au fil des saisons"
        title={["Les grands", <span key="i" className="it accent">rendez-vous.</span>]}
        intro={<p>Quand une collection de fêtes s’ouvre à la précommande, elle apparaît ici, avec ses dates de retrait.</p>}
        aside={
          featured ? (
            <article className="event-card event-card--hero">
              <EventLink c={featured} sizes="(min-width: 960px) 44vw, 100vw" />
            </article>
          ) : (
            <div className="event-empty">
              <p className="label label--light">Précommandes</p>
              <p className="event-empty-title">Aucune collection ouverte pour le moment.</p>
              <p className="event-empty-text">Les créations de fêtes apparaissent ici dès l’ouverture des précommandes.</p>
            </div>
          )
        }
      >
        <Link href="/commandes-speciales" className="btn btn--dark">Préparer mon événement</Link>
      </PageHero>
      {others.length > 0 && (
        <section className="section events">
          <div className="wrap events-grid">
            {others.map((c, i) => (
              <Reveal key={c.id} as="article" className="event-card" delay={i * 0.08}>
                <EventLink c={c} sizes="(min-width: 900px) 50vw, 100vw" />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

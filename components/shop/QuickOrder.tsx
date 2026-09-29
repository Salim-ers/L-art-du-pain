import Link from "next/link";
import { Reveal } from "../Reveal";
import { SectionLabel } from "../SectionLabel";
import { ProductImage } from "./ProductImage";

export type QuickCard = { href: string; title: string; tagline: string | null; image: string | null; accent?: boolean };

/** « Que souhaitez-vous commander ? » — grandes cartes photographiques, placées haut sur l'accueil. */
export function QuickOrder({ cards }: { cards: QuickCard[] }) {
  return (
    <section id="commander" className="section qo" aria-labelledby="qo-title">
      <div className="wrap">
        <div className="qo-head">
          <div className="stack">
            <SectionLabel>Commande en ligne — Click &amp; Collect</SectionLabel>
            <Reveal as="h2" className="h-lg" id="qo-title">
              Que souhaitez-vous <span className="it accent">commander ?</span>
            </Reveal>
          </div>
          <Reveal as="p" className="qo-intro">
            Choisissez, réservez votre créneau, retirez en boutique. Vos créations sont prêtes à votre arrivée.
          </Reveal>
        </div>
        <div className="qo-grid">
          {cards.map((c, i) => (
            <Reveal key={c.href + c.title} className={"qo-card" + (c.accent ? " qo-card--accent" : "")} delay={(i % 4) * 0.07}>
              <Link href={c.href} className="qo-link">
                <span className="qo-media">
                  <ProductImage src={c.image} alt={c.title} sizes="(min-width: 1100px) 24vw, (min-width: 700px) 45vw, 72vw" tone="dark" />
                </span>
                <span className="qo-veil" aria-hidden="true" />
                <span className="qo-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <span className="qo-text">
                  <span className="qo-title">{c.title}</span>
                  {c.tagline && <span className="qo-tag">{c.tagline}</span>}
                  <span className="qo-cta">
                    Découvrir <span className="arrow" aria-hidden="true">→</span>
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

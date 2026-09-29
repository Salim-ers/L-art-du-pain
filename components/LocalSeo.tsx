import Link from "next/link";
import { site } from "@/content/site";
import { Directions } from "./Directions";
import { Line, Reveal } from "./Reveal";
import { SectionLabel } from "./SectionLabel";

/** « Boulangerie pâtisserie à Nogent-sur-Oise » : contenu local rédigé, NAP visible, accès. */
export function LocalSeo({ reviewUrl, headingLevel = "h2" }: { reviewUrl?: string | null; headingLevel?: "h1" | "h2" }) {
  const { local, address, phone, hours } = site;
  const H = headingLevel;
  return (
    <section id="nogent" className="section local" aria-labelledby="local-title">
      <div className="wrap local-grid">
        <div className="local-main">
          <SectionLabel>Nogent-sur-Oise — Oise (60)</SectionLabel>
          <H className="h-lg" id="local-title">
            <Line>Boulangerie pâtisserie</Line>
            <Line delay={0.08}><span className="it accent">à Nogent-sur-Oise</span></Line>
          </H>
          {local.paragraphs.map((p, i) => (
            <Reveal as="p" key={i} className="body body--sm" delay={0.1 + i * 0.06}>{p}</Reveal>
          ))}
          <Reveal as="address" className="nap" delay={0.16}>
            <strong>{site.name}</strong>
            <span>{address.street}, {address.postalCode} {address.city}</span>
            {phone && <a href={"tel:" + phone.tel}>{phone.display}</a>}
            {hours && <span>{hours.display}</span>}
          </Reveal>
          <Directions reviewUrl={reviewUrl} />
        </div>
        <Reveal as="ul" className="towns" delay={0.1}>
          {local.towns.map((t) => (
            <li key={t.name}>
              <span className="towns-name">{t.name}</span>
              <span className="towns-text">{t.text}</span>
            </li>
          ))}
          <li className="towns-more">
            <Link href="/nous-trouver" className="ulink">
              <span>Venir à la boutique</span>
              <span className="arrow" aria-hidden="true">→</span>
            </Link>
          </li>
        </Reveal>
      </div>
    </section>
  );
}

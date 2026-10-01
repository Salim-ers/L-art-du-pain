import Image from "next/image";
import { site } from "@/content/site";
import { photos } from "@/content/photos";
import { SectionLabel } from "../SectionLabel";
import { Line, Reveal } from "../Reveal";

/** La boutique et le métier : peu de mots, deux photos (le comptoir réel, le geste). */
export function Maison() {
  const { counter, kneading } = photos;
  return (
    <section id="maison" className="section maison" aria-labelledby="maison-title">
      <div className="wrap maison-grid">
        <div className="maison-text">
          <SectionLabel>La boutique</SectionLabel>
          <h2 className="h-lg" id="maison-title">
            <Line>Une boulangerie</Line>
            <Line delay={0.08}><span className="it accent">de quartier.</span></Line>
          </h2>
          <Reveal as="p" className="body body--sm" delay={0.1}>
            {site.address.street}, à {site.address.city}. Le pain du matin, les viennoiseries, la vitrine de pâtisseries — et,
            sur commande, les gâteaux des grandes occasions.
          </Reveal>
        </div>
        <Reveal kind="mask" className="maison-main">
          <Image src={counter.src} alt={counter.alt} fill sizes="(min-width: 900px) 40vw, 100vw" className="media-img" />
        </Reveal>
        <Reveal kind="mask" className="maison-detail" delay={0.12}>
          <Image src={kneading.src} alt={kneading.alt} fill sizes="(min-width: 900px) 34vw, 100vw" className="media-img" />
        </Reveal>
      </div>
    </section>
  );
}

import Image from "next/image";
import Link from "next/link";
import { photos } from "@/content/photos";
import { Line, Reveal } from "../Reveal";

/** Fonctionnalité phare : le gâteau sur mesure. Chaque occasion ouvre le configurateur déjà orienté. */
export function CustomCake({ occasions }: { occasions: string[] }) {
  const p = photos.heartCake;
  return (
    <section id="sur-mesure" className="cake" aria-labelledby="cake-title">
      <div className="cake-grid">
        <Reveal kind="mask" className="cake-media">
          <Image src={p.src} alt={p.alt} fill sizes="(min-width: 900px) 50vw, 100vw" className="media-img" />
        </Reveal>
        <div className="cake-text section">
          <Reveal as="p" className="label label--light">Gâteaux sur mesure</Reveal>
          <h2 className="h-xl" id="cake-title">
            <Line>Un gâteau</Line>
            <Line delay={0.08}><span className="it blush">imaginé pour vous.</span></Line>
          </h2>
          <Reveal as="p" className="cake-intro" delay={0.1}>
            Choisissez l’occasion, le nombre de parts, le style et les saveurs, joignez une photo d’inspiration.
            Nous étudions votre demande et vous confirmons le tarif.
          </Reveal>
          <Reveal as="ul" className="cake-occasions" delay={0.14}>
            {occasions.map((o) => (
              <li key={o}>
                <Link href={"/gateaux-sur-mesure?occasion=" + encodeURIComponent(o)}>{o}</Link>
              </li>
            ))}
          </Reveal>
          <Reveal delay={0.18}>
            <Link href="/gateaux-sur-mesure" className="btn btn--light-solid">
              <span className="roll">
                <span>Créer mon gâteau</span>
                <span aria-hidden="true">Créer mon gâteau</span>
              </span>
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

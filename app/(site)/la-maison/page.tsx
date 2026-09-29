import type { Metadata } from "next";
import Link from "next/link";
import { Breath } from "@/components/Breath";
import { Editorial } from "@/components/Editorial";
import { Manifesto } from "@/components/Manifesto";
import { Marquee } from "@/components/Marquee";
import { PageHero } from "@/components/PageHero";
import { CustomTeaser } from "@/components/Teasers";

export const metadata: Metadata = {
  title: "La Maison — boulangerie artisanale à Nogent-sur-Oise",
  description:
    "L’Art du Pain, boulangerie pâtisserie de quartier à Nogent-sur-Oise : le pain du matin, la viennoiserie du dimanche, la pâtisserie que l’on rapporte. Notre façon de faire.",
  alternates: { canonical: "/la-maison" },
};

export default function MaisonPage() {
  return (
    <main id="contenu">
      <PageHero
        crumbs={[{ name: "La Maison", path: "/la-maison" }]}
        label="Boulangerie • Pâtisserie — Nogent-sur-Oise"
        title={["Une maison", <span key="i" className="it accent">de quartier.</span>]}
        intro={<p>Une boulangerie pâtisserie artisanale, 28 Avenue Saint-Exupéry à Nogent-sur-Oise. Ici, l’exigence n’est pas une posture : c’est la manière de faire.</p>}
      >
        <Link href="/savoir-faire" className="btn btn--dark">Notre savoir-faire</Link>
        <Link href="/commander" className="btn btn--solid">Commander</Link>
      </PageHero>
      <Manifesto />
      <Editorial />
      <Marquee />
      <Breath />
      <CustomTeaser />
    </main>
  );
}

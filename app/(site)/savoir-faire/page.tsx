import type { Metadata } from "next";
import Link from "next/link";
import { CraftSection } from "@/components/CraftSection";
import { ImmersiveSequence } from "@/components/ImmersiveSequence";
import { Marquee } from "@/components/Marquee";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Notre savoir-faire — pétrir, façonner, cuire",
  description:
    "Le savoir-faire de L’Art du Pain à Nogent-sur-Oise : pétrissage, façonnage à la main, fermentation lente et cuisson sur place, chaque jour.",
  alternates: { canonical: "/savoir-faire" },
};

export default function SavoirFairePage() {
  return (
    <main id="contenu">
      <PageHero
        crumbs={[{ name: "Notre savoir-faire", path: "/savoir-faire" }]}
        label="Le geste"
        title={["Le savoir-faire,", <span key="i" className="it accent">façonné chaque jour.</span>]}
        intro={<p>{site.craft.intro}</p>}
      />
      <CraftSection />
      <section className="section steps-text">
        <div className="wrap steps-text-grid">
          {site.craft.steps.map((s, i) => (
            <Reveal key={s.title} className="steps-text-item" delay={i * 0.06}>
              <span className="craft-num">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="h-md">{s.title}</h2>
              <p className="body body--sm">{s.text}</p>
            </Reveal>
          ))}
        </div>
      </section>
      <ImmersiveSequence />
      <Marquee />
      <section className="section breath">
        <Link href="/commander" className="btn btn--solid">Goûter le résultat — commander</Link>
      </section>
    </main>
  );
}

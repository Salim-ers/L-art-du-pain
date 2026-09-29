import { site } from "@/content/site";
import { Intro } from "@/components/Intro";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Manifesto } from "@/components/Manifesto";
import { Editorial } from "@/components/Editorial";
import { Creations } from "@/components/Creations";
import { SignatureProduct } from "@/components/SignatureProduct";
import { Marquee } from "@/components/Marquee";
import { CraftSection } from "@/components/CraftSection";
import { ImmersiveSequence } from "@/components/ImmersiveSequence";
import { Breath } from "@/components/Breath";
import { Gallery } from "@/components/Gallery";
import { Reviews } from "@/components/Reviews";
import { Location } from "@/components/Location";
import { Footer } from "@/components/Footer";
import { localBusinessJsonLd } from "@/lib/schema";

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd(site)) }}
      />
      <Intro />
      <Header />
      <main id="contenu">
        <Hero />
        <Manifesto />
        <Editorial />
        <Creations />
        <SignatureProduct />
        <Marquee />
        <CraftSection />
        <ImmersiveSequence />
        <Breath />
        <Gallery />
        <Reviews />
        <Location />
      </main>
      <Footer />
    </>
  );
}

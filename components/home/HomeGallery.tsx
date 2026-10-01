import Link from "next/link";
import { GalleryGrid, type GalleryItem } from "../GalleryGrid";
import { SectionLabel } from "../SectionLabel";
import { Reveal } from "../Reveal";

/** Une sélection des réalisations (photos ajoutées depuis la gestion), en mise en page magazine. */
export function HomeGallery({ items }: { items: GalleryItem[] }) {
  if (!items.length) return null;
  return (
    <section id="galerie" className="section hgal" aria-labelledby="hgal-title">
      <div className="wrap">
        <div className="hgal-head">
          <div>
            <SectionLabel>Galerie</SectionLabel>
            <Reveal as="h2" className="h-lg" id="hgal-title">Nos réalisations</Reveal>
          </div>
          <Link href="/galerie" className="ulink label">
            <span>Voir nos réalisations</span>
            <span className="arrow" aria-hidden="true">→</span>
          </Link>
        </div>
        <GalleryGrid items={items.slice(0, 7)} />
      </div>
    </section>
  );
}

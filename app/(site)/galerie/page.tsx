import type { Metadata } from "next";
import { GalleryGrid } from "@/components/GalleryGrid";
import { PageHero } from "@/components/PageHero";
import { galleryFilters, getGallery } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Galerie — la boutique et les créations",
  description: "Pains, viennoiseries, pâtisseries et la boutique L’Art du Pain à Nogent-sur-Oise, en images.",
  alternates: { canonical: "/galerie" },
};

export default async function GaleriePage() {
  const items = await getGallery();
  return (
    <main id="contenu">
      <PageHero
        compact
        crumbs={[{ name: "Galerie", path: "/galerie" }]}
        label="Boutique • Fournil • Créations"
        title={["La Galerie"]}
      />
      <section className="section gallery-page">
        <div className="wrap">
          <GalleryGrid
            items={items.map((m) => ({ id: m.id, url: m.url, alt: m.alt, caption: m.caption, category: m.category, format: m.format }))}
            filters={galleryFilters}
          />
        </div>
      </section>
    </main>
  );
}

import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/lib/db/schema";
import type { CampaignView } from "@/lib/catalog";
import { campaignStateLabel } from "@/lib/events";
import { familyPhotos, isUploaded } from "@/content/photos";
import { demoFamilyPhotos } from "@/content/demo-photos";
import { SectionLabel } from "../SectionLabel";
import { Reveal } from "../Reveal";

type Card = { key: string; title: string; text: string | null; href: string; image: { src: string; alt: string } | null };

/**
 * « Nos créations » : les grandes familles, en photos. Une famille n'apparaît que si elle a une vraie photo
 * (ajoutée depuis la gestion, ou visuel de l'univers défini dans content/photos.ts). Les gâteaux ont leur propre section.
 */
export function Families({ categories, campaign, demo }: { categories: Category[]; campaign: CampaignView | null; demo: boolean }) {
  const cards: Card[] = categories
    .filter((c) => c.slug !== "fetes" && c.slug !== "gateaux")
    .map((c) => {
      const photo = isUploaded(c.image) ? { src: c.image, alt: c.name } : familyPhotos[c.slug] ?? (demo ? demoFamilyPhotos[c.slug] : null) ?? null;
      return { key: c.slug, title: c.name, text: c.tagline, href: "/commander/" + c.slug, image: photo };
    })
    .filter((c) => c.image);

  const seasonImage = campaign?.heroImage ? { src: campaign.heroImage, alt: campaign.name } : null;
  cards.push({
    key: "saison",
    title: "Créations de saison",
    text: campaign ? `${campaign.name} — ${campaignStateLabel[campaign.state].toLowerCase()}` : "Noël, Épiphanie : à précommander à l’approche des fêtes.",
    href: campaign ? (campaign.kind === "noel" ? "/noel" : "/evenements/" + campaign.slug) : "/evenements",
    image: seasonImage,
  });

  return (
    <section id="creations" className="section fams" aria-labelledby="fams-title">
      <div className="wrap">
        <div className="fams-head">
          <SectionLabel>Nos créations</SectionLabel>
          <Reveal as="h2" className="h-xl" id="fams-title">
            Du fournil <span className="it accent">à la vitrine.</span>
          </Reveal>
        </div>
        <div className="fams-grid" data-count={cards.length}>
          {cards.map((c, i) => (
            <Reveal key={c.key} className={"fam2" + (c.image ? "" : " fam2--text")} delay={(i % 2) * 0.08}>
              <Link href={c.href} className="fam2-link">
                {c.image && (
                  <span className="fam2-media">
                    <Image src={c.image.src} alt={c.image.alt} fill sizes="(min-width: 900px) 50vw, 100vw" className="media-img" />
                  </span>
                )}
                <span className="fam2-text">
                  <span className="fam2-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  <span className="fam2-title">{c.title}</span>
                  {c.text && <span className="fam2-tag">{c.text}</span>}
                  <span className="fam2-cta">Découvrir <span className="arrow" aria-hidden="true">→</span></span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import type { CampaignView } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { campaignStateLabel } from "@/lib/events";
import { Line, Reveal } from "./Reveal";
import { ImageReveal } from "./ImageReveal";

/** Halo de lumières chaudes (bokeh CSS, uniquement transform/opacity). */
export function WarmLights({ count = 14 }: { count?: number }) {
  return (
    <div className="lights" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} style={{ ["--x" as string]: ((i * 37) % 100) + "%", ["--y" as string]: ((i * 53) % 90) + "%", ["--s" as string]: 40 + ((i * 29) % 110) + "px", ["--d" as string]: (i % 7) * 0.9 + "s" }} />
      ))}
    </div>
  );
}

export function pickupWindow(c: Pick<CampaignView, "dates">) {
  if (!c.dates.length) return null;
  const first = c.dates[0];
  const last = c.dates[c.dates.length - 1];
  return first === last ? `Retrait le ${formatDate(first)}` : `Disponible en retrait du ${formatDate(first, "short")} au ${formatDate(last, "short")}`;
}

/** Bandeau saisonnier sur l'accueil (Noël ou toute campagne publiée). */
export function CampaignTeaser({ campaign }: { campaign: CampaignView | null }) {
  if (!campaign) return null;
  const href = campaign.kind === "noel" ? "/noel" : "/evenements/" + campaign.slug;
  const range = pickupWindow(campaign);
  return (
    <section className="xmas-teaser" aria-labelledby="xmas-title">
      <WarmLights />
      <div className="wrap section xmas-teaser-inner">
        <Reveal as="p" className="label label--light">
          {campaign.name} — {campaignStateLabel[campaign.state]}
        </Reveal>
        <h2 className="h-xl" id="xmas-title">
          <Line>{campaign.headline ?? campaign.name}</Line>
          {campaign.subtitle && (
            <Line delay={0.08}>
              <span className="it blush">{campaign.subtitle}</span>
            </Line>
          )}
        </h2>
        {range && <Reveal as="p" className="xmas-window">{range}</Reveal>}
        <Reveal delay={0.12}>
          <Link href={href} className="btn btn--light-solid">
            <span className="roll">
              <span>Découvrir la collection</span>
              <span aria-hidden="true">Découvrir la collection</span>
            </span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/** Invitation au configurateur de gâteau personnalisé. */
export function CustomTeaser() {
  return (
    <section className="section custom-teaser" aria-labelledby="custom-title">
      <div className="wrap custom-teaser-grid">
        <ImageReveal image={{ src: "/images/entremets-coeur.png", alt: "Entremets cœur personnalisé" }} ratio="4 / 5" speed={0.05} sizes="(min-width: 860px) 42vw, 100vw" />
        <div className="custom-teaser-text">
          <Reveal as="p" className="label">Gâteaux sur mesure</Reveal>
          <h2 className="h-xl" id="custom-title">
            <Line>Créez</Line>
            <Line delay={0.08}><span className="it accent">votre gâteau.</span></Line>
          </h2>
          <Reveal as="p" className="body body--sm" delay={0.1}>
            Anniversaire, mariage, baptême, événement d’entreprise : choisissez l’occasion, le nombre de parts, les saveurs et le message. Joignez une photo d’inspiration, nous nous occupons du reste.
          </Reveal>
          <Reveal as="ol" className="custom-steps" delay={0.14}>
            <li><span>01</span>L’occasion et le nombre de personnes</li>
            <li><span>02</span>Le type de gâteau et les saveurs</li>
            <li><span>03</span>Le message, la photo, la date</li>
          </Reveal>
          <Reveal delay={0.18}>
            <Link href="/gateaux-sur-mesure" className="btn btn--solid">
              <span className="roll">
                <span>Composer mon gâteau</span>
                <span aria-hidden="true">Composer mon gâteau</span>
              </span>
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

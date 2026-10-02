import Link from "next/link";
import type { CampaignView, ProductView } from "@/lib/catalog";
import { campaignStateLabel } from "@/lib/events";
import { formatDate, money } from "@/lib/format";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/schema";
import { JsonLd } from "./JsonLd";
import { Line, Reveal } from "./Reveal";
import { AddToCart } from "./shop/AddToCart";
import { ProductImage } from "./shop/ProductImage";
import { DemoNote } from "./shop/CatalogNotes";
import { pickupWindow, WarmLights } from "./Teasers";
import { Faq, type FaqItem } from "./Faq";

const closing = (c: CampaignView) =>
  c.orderClosesAt
    ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" }).format(c.orderClosesAt)
    : null;

/** Landing saisonnière (Noël, Épiphanie, Pâques…) : hero immersif sombre, collection éditoriale, précommande. */
export function CampaignPage({ campaign: c, products, path, faq }: { campaign: CampaignView; products: ProductView[]; path: string; faq?: FaqItem[] }) {
  const range = pickupWindow(c);
  const close = closing(c);
  const opens = c.orderOpensAt ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" }).format(c.orderOpensAt) : null;
  const remaining = c.maxOrders !== null ? Math.max(0, c.maxOrders - c.orderCount) : null;

  return (
    <main id="contenu" className="camp">
      <JsonLd data={breadcrumbJsonLd([{ name: "Accueil", path: "/" }, { name: "Événements", path: "/evenements" }, { name: c.name, path }])} />
      <JsonLd data={itemListJsonLd(c.name, products)} />
      <section className="camp-hero" aria-labelledby="camp-title">
        {c.heroImage && (
          <div className="camp-hero-media">
            <ProductImage src={c.heroImage} alt="" sizes="100vw" priority tone="dark" />
          </div>
        )}
        <div className="camp-hero-veil" aria-hidden="true" />
        <WarmLights count={18} />
        <div className="camp-hero-copy section">
          <p className="hero-kicker hero-in">{c.name} — {campaignStateLabel[c.state]}</p>
          <h1 className="camp-title" id="camp-title">
            <span className="line"><span className="w">{c.headline ?? c.name}</span></span>
          </h1>
          {c.subtitle && <p className="camp-sub hero-in">{c.subtitle}</p>}
          <div className="camp-meta hero-in">
            {range && <span>{range}</span>}
            {c.state === "open" && close && <span>Précommandes jusqu’au {close}</span>}
            {c.state === "upcoming" && opens && <span>Ouverture des précommandes le {opens}</span>}
            {c.state === "open" && remaining !== null && remaining <= 30 && <span>Plus que {remaining} commandes possibles</span>}
          </div>
          {products.length > 0 && (
            <a href="#collection" className="hero-order hero-in">
              <span className="roll"><span>{c.state === "open" ? "Commander" : "Découvrir la collection"}</span><span aria-hidden="true">{c.state === "open" ? "Commander" : "Découvrir la collection"}</span></span>
              <span className="arrow" aria-hidden="true">↓</span>
            </a>
          )}
        </div>
      </section>

      {c.description && (
        <section className="section camp-intro">
          <div className="wrap">
            <Reveal as="p" className="camp-lead">{c.description}</Reveal>
          </div>
        </section>
      )}

      {c.state !== "open" && (
        <div className="section">
          <p className="wrap notice camp-state">
            {c.state === "full"
              ? "La collection est complète : merci pour votre confiance ! Quelques pièces peuvent rester disponibles en boutique."
              : c.state === "upcoming"
                ? `Les précommandes ouvrent ${opens ? "le " + opens : "bientôt"}. Découvrez dès maintenant la collection.`
                : "Les précommandes sont terminées pour cette saison. Merci à toutes et à tous !"}
          </p>
        </div>
      )}

      <section id="collection" className="section camp-list" aria-label="La collection">
        <div className="wrap">
          <div className="camp-demo"><DemoNote products={products} /></div>
          {products.map((p, i) => (
            <article key={p.id} className="camp-item" data-flip={i % 2 ? "" : undefined}>
              <Reveal kind="mask" className="camp-media">
                <ProductImage src={p.image} alt={p.name} sizes="(min-width: 900px) 50vw, 100vw" tone="dark" />
              </Reveal>
              <div className="camp-text">
                <Reveal as="p" className="label label--light">{String(i + 1).padStart(2, "0")} — {c.name}{p.demo && " — exemple"}</Reveal>
                <h2 className="h-lg"><Line>{p.name}</Line></h2>
                {p.description && <Reveal as="p" className="camp-desc">{p.description}</Reveal>}
                {p.composition && (
                  <Reveal as="p" className="camp-comp"><span>Composition</span>{p.composition}</Reveal>
                )}
                <Reveal as="p" className="camp-price">
                  {p.variants.length ? p.variants.map((v) => `${v.label} — ${money(v.priceCents)}`).join(" · ") : money(p.priceCents)}
                </Reveal>
                {p.allergens.length > 0 && <p className="camp-allergens">Allergènes : {p.allergens.join(", ")}</p>}
                {range && <p className="camp-window">{range}</p>}
                <AddToCart product={p} tone="dark" />
                <Link href={"/produit/" + p.slug} className="ulink camp-more"><span>Fiche détaillée</span><span className="arrow" aria-hidden="true">→</span></Link>
              </div>
            </article>
          ))}
          {!products.length && <p className="camp-desc">La collection sera dévoilée très prochainement.</p>}
        </div>
      </section>

      {c.dates.length > 0 && (
        <section className="section camp-dates" aria-labelledby="dates-title">
          <div className="wrap">
            <h2 className="h-md" id="dates-title">Dates de retrait</h2>
            <ul>
              {c.dates.map((d) => <li key={d}>{formatDate(d)}</li>)}
            </ul>
            <p className="camp-desc">Retrait en boutique, 28 Avenue Saint-Exupéry à Nogent-sur-Oise. Vous choisissez votre créneau au moment de la commande.</p>
          </div>
        </section>
      )}

      {faq && <div className="camp-faq"><Faq items={faq} /></div>}
    </main>
  );
}

import type { ReassuranceSettings } from "@/lib/settings-shared";
import { Reveal } from "./Reveal";

type Review = { text: string; author: string; rating?: number; source?: string; date?: string };

/**
 * Réassurance + avis clients. Uniquement des arguments vérifiés et de vrais avis (saisis dans /admin/parametres,
 * sinon le relevé d'avis Google de content/google-reviews.ts). Aucun témoignage n'est jamais inventé.
 */
export function Reviews({
  items,
  reviewUrl,
  reassurance = [],
  summary,
}: {
  items: Review[];
  reviewUrl: string;
  reassurance?: ReassuranceSettings["items"];
  summary?: { rating: string; count: number; date: string } | null;
}) {
  return (
    <section id="avis" className="section reviews" aria-labelledby="avis-title">
      {reassurance.length > 0 && (
        <ul className="assure wrap" aria-label="Nos engagements">
          {reassurance.map((a, n) => (
            <Reveal as="li" key={a.title} delay={n * 0.06}>
              <strong>{a.title}</strong>
              {a.text && <span>{a.text}</span>}
            </Reveal>
          ))}
        </ul>
      )}
      <div className="wrap rv-head">
        <Reveal as="p" className="label">Avis clients</Reveal>
        <Reveal as="h2" className="h-lg" id="avis-title">Ce qu’en disent nos clients</Reveal>
        {summary && (
          <Reveal as="p" className="rv-summary">
            <span className="rv-stars" aria-hidden="true">★★★★★</span>
            <strong>{summary.rating} / 5</strong> sur Google · {summary.count} avis <small>(relevé {summary.date})</small>
          </Reveal>
        )}
      </div>
      {items.length > 0 ? (
        <ul className="wrap rv-grid">
          {items.slice(0, 6).map((r, i) => (
            <Reveal as="li" key={r.author + i} className="rv-card" delay={(i % 2) * 0.08}>
              {r.rating && (
                <span className="rv-stars" aria-label={`${r.rating} sur 5`}>
                  {"★".repeat(r.rating)}
                  <span aria-hidden="true" className="rv-stars-off">{"★".repeat(5 - r.rating)}</span>
                </span>
              )}
              <blockquote>« {r.text} »</blockquote>
              <p className="rv-author">
                {r.author}
                <small>{[r.source, r.date].filter(Boolean).join(" · ")}</small>
              </p>
            </Reveal>
          ))}
        </ul>
      ) : (
        <p className="review-empty wrap">Vous êtes passé·e à la boutique ? Votre avis aide d’autres gourmands à nous trouver.</p>
      )}
      <div className="rv-foot">
        <a href={reviewUrl} target="_blank" rel="noopener noreferrer" className="btn btn--dark">
          <span className="roll">
            <span>Laisser un avis Google ↗</span>
            <span aria-hidden="true">Laisser un avis Google ↗</span>
          </span>
        </a>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import type { ReassuranceSettings, ReviewsSettings } from "@/lib/settings-shared";
import { Reveal } from "./Reveal";

/**
 * Réassurance + avis clients. Uniquement des arguments vérifiés et de vrais avis, saisis dans /admin/parametres.
 * Sans avis, la section reste une invitation sobre à en laisser un : aucun témoignage n'est jamais inventé.
 */
export function Reviews({
  items,
  reviewUrl,
  reassurance = [],
}: {
  items: ReviewsSettings["items"];
  reviewUrl: string;
  reassurance?: ReassuranceSettings["items"];
}) {
  const [i, setI] = useState(0);
  const r = items[i];
  const many = items.length > 1;

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
      <div className="reviews-inner">
        <Reveal as="p" className="label">Avis clients</Reveal>
        <Reveal as="h2" className="h-md" id="avis-title">Ce qu’en disent nos clients</Reveal>
        {r ? (
          <blockquote key={i} className="review">
            {r.rating && (
              <span className="review-stars" aria-label={`${r.rating} sur 5`}>
                {"★".repeat(r.rating)}
                <span aria-hidden="true" className="review-stars-off">{"★".repeat(5 - r.rating)}</span>
              </span>
            )}
            <p>« {r.text} »</p>
            <footer>
              {r.author}
              {r.source ? " — " + r.source : ""}
            </footer>
          </blockquote>
        ) : (
          <p className="review-empty">Vous êtes passé·e à la boutique ? Votre avis aide d’autres gourmands à nous trouver.</p>
        )}
        {many && (
          <div className="reviews-nav">
            <button type="button" onClick={() => setI((i - 1 + items.length) % items.length)} aria-label="Avis précédent">←</button>
            <span>{String(i + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</span>
            <button type="button" onClick={() => setI((i + 1) % items.length)} aria-label="Avis suivant">→</button>
          </div>
        )}
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

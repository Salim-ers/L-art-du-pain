"use client";

import { useState } from "react";
import type { ReviewsSettings } from "@/lib/settings-shared";
import { Reveal } from "./Reveal";

/**
 * « Ils parlent de la Maison » — uniquement de vrais avis, saisis dans /admin/parametres.
 * Sans avis, la section reste une invitation sobre à en laisser un.
 */
export function Reviews({ items, reviewUrl }: { items: ReviewsSettings["items"]; reviewUrl: string }) {
  const [i, setI] = useState(0);
  const r = items[i];
  const many = items.length > 1;

  return (
    <section id="avis" className="section reviews" aria-labelledby="avis-title">
      <div className="reviews-inner">
        <Reveal as="p" className="label">Avis clients</Reveal>
        <Reveal as="h2" className="h-md" id="avis-title">Ils parlent de la Maison</Reveal>
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
          <p className="review-empty">Vous êtes venu·e à la boutique ? Votre avis aide d’autres gourmands à nous trouver.</p>
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

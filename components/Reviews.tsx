"use client";

import { useState } from "react";
import { site } from "@/content/site";
import { Reveal } from "./Reveal";

/** One large testimonial at a time. Hidden entirely until real reviews are added to content/site.ts. */
export function Reviews() {
  const reviews = site.reviews;
  const [i, setI] = useState(0);
  if (!reviews.length) return null;
  const r = reviews[i];
  const many = reviews.length > 1;

  return (
    <section id="avis" className="section reviews" aria-label="Avis clients">
      <div className="reviews-inner">
        <Reveal as="p" className="label">Ils parlent de nous</Reveal>
        <blockquote key={i} className="review">
          <p>« {r.text} »</p>
          <footer>
            {r.author}
            {r.source ? " — " + r.source : ""}
          </footer>
        </blockquote>
        {many && (
          <div className="reviews-nav">
            <button type="button" onClick={() => setI((i - 1 + reviews.length) % reviews.length)} aria-label="Avis précédent">←</button>
            <span>{String(i + 1).padStart(2, "0")} / {String(reviews.length).padStart(2, "0")}</span>
            <button type="button" onClick={() => setI((i + 1) % reviews.length)} aria-label="Avis suivant">→</button>
          </div>
        )}
      </div>
    </section>
  );
}

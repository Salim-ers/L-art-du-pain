"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export type GalleryItem = { id: string; url: string; alt: string; caption: string | null; category: string; format: string };

/** Galerie éditoriale (formats mêlés : portrait, paysage, grand format), filtrable, avec visionneuse plein écran. */
export function GalleryGrid({ items, filters = [] }: { items: GalleryItem[]; filters?: { id: string; label: string }[] }) {
  const [filter, setFilter] = useState("tout");
  const [box, setBox] = useState<number | null>(null);
  const shown = filter === "tout" ? items : items.filter((i) => i.category === filter);

  useEffect(() => {
    if (box === null) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBox(null);
      if (e.key === "ArrowRight") setBox((b) => (b === null ? b : Math.min(shown.length - 1, b + 1)));
      if (e.key === "ArrowLeft") setBox((b) => (b === null ? b : Math.max(0, b - 1)));
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", k);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", k);
    };
  }, [box, shown.length]);

  const lb = box !== null ? shown[box] : null;

  return (
    <>
      {filters.length > 0 && (
        <div className="gfilters" role="tablist" aria-label="Filtrer la galerie">
          {filters.map((f) => (
            <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} className="ctab" onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      )}
      <div className="masonry" key={filter}>
        {shown.map((it, i) => (
          <figure key={it.id} className={"mcell mcell--" + it.format} style={{ ["--i" as string]: i % 12 }}>
            <button type="button" onClick={() => setBox(i)} aria-label={"Agrandir : " + (it.caption ?? it.alt)}>
              <Image src={it.url} alt={it.alt} fill sizes="(min-width: 1100px) 33vw, (min-width: 640px) 50vw, 100vw" className="media-img" />
            </button>
            {it.caption && <figcaption>{it.caption}</figcaption>}
          </figure>
        ))}
        {!shown.length && <p className="body">Aucune photo dans cette catégorie pour le moment.</p>}
      </div>
      {lb && box !== null && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={lb.caption ?? lb.alt} onClick={() => setBox(null)}>
          <div className="lightbox-img" onClick={(e) => e.stopPropagation()}>
            <Image src={lb.url} alt={lb.alt} fill sizes="100vw" style={{ objectFit: "contain" }} />
          </div>
          <div className="lightbox-bar" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setBox(Math.max(0, box - 1))} aria-label="Image précédente">←</button>
            <span>{String(box + 1).padStart(2, "0")} / {String(shown.length).padStart(2, "0")}{lb.caption ? " — " + lb.caption : ""}</span>
            <button type="button" onClick={() => setBox(Math.min(shown.length - 1, box + 1))} aria-label="Image suivante">→</button>
            <button type="button" className="lightbox-close" onClick={() => setBox(null)}>Fermer</button>
          </div>
        </div>
      )}
    </>
  );
}

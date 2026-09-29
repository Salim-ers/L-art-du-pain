"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { site } from "@/content/site";
import { Media } from "./Media";
import { Reveal } from "./Reveal";

const pad = (n: number) => String(n).padStart(2, "0");

/** Full-bleed carousel: centred slide in focus, neighbours bleed off-screen. Drag, arrows, keys, lightbox. */
export function Gallery() {
  const items = site.gallery;
  const view = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const slides = useRef<(HTMLElement | null)[]>([]);
  const idxRef = useRef(0);
  const drag = useRef({ down: false, moved: false, startX: 0, startOff: 0, cur: 0 });
  const [idx, setIdx] = useState(0);
  const [box, setBox] = useState<number | null>(null);

  const offsetFor = useCallback((i: number) => {
    const v = view.current;
    const s = slides.current[i];
    if (!v || !s) return 0;
    return v.clientWidth / 2 - (s.offsetLeft + s.offsetWidth / 2);
  }, []);

  const paint = useCallback((off: number, animate: boolean) => {
    const t = track.current;
    if (!t) return;
    t.style.transition = animate ? "transform 1s var(--ease-io)" : "none";
    t.style.transform = "translate3d(" + off.toFixed(1) + "px,0,0)";
    drag.current.cur = off;
  }, []);

  const go = useCallback(
    (i: number, animate = true) => {
      const n = Math.max(0, Math.min(items.length - 1, i));
      idxRef.current = n;
      setIdx(n);
      paint(offsetFor(n), animate);
    },
    [items.length, offsetFor, paint]
  );

  useEffect(() => {
    go(0, false);
    const t = window.setTimeout(() => go(idxRef.current, false), 400);
    const onResize = () => go(idxRef.current, false);
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, [go]);

  const nearest = (off: number) => {
    let best = 0;
    let bd = Infinity;
    items.forEach((_, i) => {
      const d = Math.abs(off - offsetFor(i));
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best;
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { ...drag.current, down: true, moved: false, startX: e.clientX, startOff: drag.current.cur };
    if (track.current) track.current.style.transition = "none";
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.down) return;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) > 6) {
      d.moved = true;
      // Capture only once it is a real drag, so plain clicks still reach the slides.
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (d.moved) paint(d.startOff + dx, false);
  };
  const onUp = () => {
    const d = drag.current;
    if (!d.down) return;
    d.down = false;
    if (d.moved) go(nearest(d.cur));
    else paint(offsetFor(idxRef.current), true);
    window.setTimeout(() => (d.moved = false), 40);
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") go(idx + 1);
    if (e.key === "ArrowLeft") go(idx - 1);
  };

  const onSlide = (i: number) => {
    if (drag.current.moved) return;
    if (i !== idx) go(i);
    else setBox(i);
  };

  useEffect(() => {
    if (box === null) return;
    const k = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setBox(null);
      if (e.key === "ArrowRight") setBox((b) => (b === null ? b : Math.min(items.length - 1, b + 1)));
      if (e.key === "ArrowLeft") setBox((b) => (b === null ? b : Math.max(0, b - 1)));
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", k);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", k);
    };
  }, [box, items.length]);

  if (!items.length) return null;
  const current = items[idx];
  const lb = box !== null ? items[box] : null;

  return (
    <section id="galerie" className="gallery">
      <div className="gallery-head section">
        <Reveal as="h2" className="h-lg">La Galerie</Reveal>
        <Reveal as="p" className="label label--soft">Boutique • Fournil • Créations</Reveal>
      </div>

      <div
        ref={view}
        className="gallery-view"
        tabIndex={0}
        role="region"
        aria-roledescription="carrousel"
        aria-label="Galerie photographique"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
      >
        <div ref={track} className="gallery-track">
          {items.map((it, i) => (
            <figure
              key={i}
              ref={(el) => {
                slides.current[i] = el;
              }}
              className={"slide slide--" + it.format}
              data-active={i === idx ? "" : undefined}
              onClick={() => onSlide(i)}
              aria-label={it.caption}
            >
              <Media src={it.image.src} alt={it.image.alt} placeholder={it.image.placeholder} sizes="(min-width: 900px) 72vw, 90vw" />
            </figure>
          ))}
        </div>
      </div>

      <div className="gallery-nav section">
        <button type="button" className="gal-btn gal-btn--prev" onClick={() => go(idx - 1)} aria-label="Image précédente" disabled={idx === 0}>←</button>
        <span className="gal-count" aria-live="polite">
          {pad(idx + 1)} / {pad(items.length)} — {current.caption}
        </span>
        <button type="button" className="gal-btn gal-btn--next" onClick={() => go(idx + 1)} aria-label="Image suivante" disabled={idx === items.length - 1}>→</button>
      </div>

      {lb && box !== null && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={lb.caption} onClick={() => setBox(null)}>
          <div className="lightbox-img" onClick={(e) => e.stopPropagation()}>
            <Media src={lb.image.src} alt={lb.image.alt} sizes="100vw" fit="contain" />
          </div>
          <div className="lightbox-bar" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setBox(Math.max(0, box - 1))} aria-label="Image précédente">←</button>
            <span>{pad(box + 1)} / {pad(items.length)} — {lb.caption}</span>
            <button type="button" onClick={() => setBox(Math.min(items.length - 1, box + 1))} aria-label="Image suivante">→</button>
            <button type="button" className="lightbox-close" onClick={() => setBox(null)}>Fermer</button>
          </div>
        </div>
      )}
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { canHover } from "@/lib/scroll";
import { SectionLabel } from "./SectionLabel";
import { EditorialHeading } from "./EditorialHeading";
import { Reveal } from "./Reveal";
import { Media } from "./Media";
import { ProductCategory } from "./ProductCategory";

export function Creations() {
  const c = site.creations;
  const cats = site.categories;
  const [active, setActive] = useState<number | null>(null);
  const follow = useRef<HTMLDivElement>(null);
  const pos = useRef({ tx: -999, ty: -999, cx: -999, cy: -999 });

  // Image preview trails the cursor with a soft lerp — only while a row is hovered.
  useEffect(() => {
    if (active === null || !canHover()) return;
    const p = pos.current;
    if (p.cx === -999) {
      p.cx = p.tx;
      p.cy = p.ty;
    }
    let raf = 0;
    const move = (e: PointerEvent) => {
      p.tx = e.clientX;
      p.ty = e.clientY;
    };
    const loop = () => {
      p.cx += (p.tx - p.cx) * 0.14;
      p.cy += (p.ty - p.cy) * 0.14;
      if (follow.current) follow.current.style.transform = "translate3d(" + p.cx.toFixed(1) + "px," + p.cy.toFixed(1) + "px,0)";
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", move, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, [active]);

  useEffect(() => {
    const track = (e: PointerEvent) => {
      pos.current.tx = e.clientX;
      pos.current.ty = e.clientY;
    };
    window.addEventListener("pointermove", track, { passive: true });
    return () => window.removeEventListener("pointermove", track);
  }, []);

  if (!cats.length) return null;

  return (
    <section id="creations" className="section creations">
      <div className="wrap creations-inner">
        <div className="creations-head">
          <div className="stack">
            <SectionLabel>{c.label}</SectionLabel>
            <EditorialHeading lines={[c.title[0], <span key="i" className="it">{c.title[1]}</span>]} />
          </div>
          <Reveal as="p" className="creations-intro">{c.intro}</Reveal>
        </div>

        <div className="cat-list">
          {cats.map((cat, i) => (
            <ProductCategory
              key={cat.id}
              index={i}
              title={cat.title}
              image={cat.image}
              href={cat.href ?? "#boutique"}
              onEnter={() => setActive(i)}
              onLeave={() => setActive((a) => (a === i ? null : a))}
            />
          ))}
        </div>
      </div>

      <div ref={follow} className="cat-follow" aria-hidden="true">
        <div className="cat-follow-box" data-on={active !== null ? "" : undefined}>
          {cats.map((cat, i) => (
            <div key={cat.id} className="cat-follow-img" data-on={active === i ? "" : undefined}>
              <Media src={cat.image.src} alt="" sizes="320px" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

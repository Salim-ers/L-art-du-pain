"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { prefersReducedMotion, useScrollFrame } from "@/lib/scroll";
import { Media } from "./Media";

/** The image stays pinned while five words take turns in front of it. */
export function ImmersiveSequence() {
  const { words, image } = site.immersive;
  const section = useRef<HTMLElement>(null);
  const media = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(-1);
  const off = useRef(false);
  useEffect(() => {
    off.current = prefersReducedMotion();
  }, []);

  useScrollFrame((_, vh) => {
    const el = section.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const total = r.height - vh;
    const p = Math.min(1, Math.max(0, -r.top / total));
    const inView = r.top <= 8 && r.bottom > vh;
    const a = inView ? Math.min(words.length - 1, Math.floor(p * words.length * 0.999)) : -1;
    setActive((prev) => (prev === a ? prev : a));
    if (media.current && !off.current) media.current.style.transform = "scale(" + (1.02 + p * 0.08).toFixed(3) + ")";
  });

  return (
    <section ref={section} className="immersive" aria-label="Séquence immersive">
      <div className="immersive-pin">
        <div ref={media} className="immersive-media">
          <Media src={image.src} alt={image.alt} placeholder={image.placeholder} dark sizes="100vw" />
        </div>
        <div className="immersive-veil" aria-hidden="true" />
        <div className="immersive-words">
          <p className="sr-only">{words.join(" ")}</p>
          <div className="immersive-stage" aria-hidden="true">
            {words.map((w, i) => (
              <span
                key={w}
                className={"immersive-word" + (i === words.length - 1 ? " it blush" : "")}
                data-state={i === active ? "on" : i < active ? "past" : "next"}
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

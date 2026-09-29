"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { site } from "@/content/site";
import { prefersReducedMotion, useScrollFrame } from "@/lib/scroll";
import { Media } from "./Media";

const v = (i: number) => ({ ["--i" as string]: i } as CSSProperties);

export function Hero() {
  const media = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const off = useRef(false);
  useEffect(() => {
    off.current = prefersReducedMotion();
  }, []);

  // Media drifts and zooms, title lifts away and dissolves as the next section arrives.
  useScrollFrame((y, vh) => {
    if (off.current || y > vh * 1.2) return;
    if (media.current) {
      media.current.style.transform =
        "translate3d(0," + (y * 0.22).toFixed(1) + "px,0) scale(" + (1 + Math.min(y / vh, 1) * 0.09).toFixed(3) + ")";
    }
    if (copy.current) {
      copy.current.style.transform = "translate3d(0," + (y * -0.12).toFixed(1) + "px,0)";
      copy.current.style.opacity = String(Math.max(0, 1 - (y / vh) * 1.25));
    }
  });

  const { hero } = site;

  return (
    <section id="top" className="hero" aria-label="Accueil">
      <div ref={media} className="hero-media">
        {hero.video ? (
          <video src={hero.video} poster={hero.image ?? undefined} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
        ) : (
          <Media src={hero.image} alt={hero.imageAlt} placeholder="Vidéo ou photo d’ouverture" priority sizes="100vw" />
        )}
      </div>
      <div className="hero-veil" aria-hidden="true" />
      <div ref={copy} className="hero-copy">
        <span aria-hidden="true" />
        <div className="hero-main">
          <p className="hero-kicker hero-in" style={v(0)}>
            Boulangerie • Pâtisserie — {site.address.city}
          </p>
          <h1 className="hero-title">
            <span className="line"><span className="w" style={v(0)}>L’ART</span></span>
            <span className="line"><span className="w" style={v(1)}>DU PAIN</span></span>
          </h1>
          <div className="hero-foot">
            <p className="hero-tag hero-in" style={v(2)}>{site.tagline}</p>
            <a href="#maison" className="ulink hero-link hero-in" style={v(3)}>
              <span>Découvrir la Maison</span>
              <span className="arrow" aria-hidden="true">↘</span>
            </a>
          </div>
        </div>
        <div className="hero-cue" aria-hidden="true">
          <span>Défiler pour découvrir</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/baguette-blanche.png" alt="" width={280} height={1010} />
        </div>
      </div>
    </section>
  );
}

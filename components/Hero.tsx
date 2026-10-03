"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { site } from "@/content/site";
import { prefersReducedMotion, useScrollFrame } from "@/lib/scroll";
import Image from "next/image";
import { photos } from "@/content/photos";

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
          <Image src={photos.interior.src} alt={photos.interior.alt} fill priority quality={85} sizes="100vw" className="media-img" style={{ objectFit: "cover" }} />
        )}
      </div>
      <div className="hero-veil" aria-hidden="true" />
      <div ref={copy} className="hero-copy">
        <span aria-hidden="true" />
        <div className="hero-main">
          <p className="hero-kicker hero-in" style={v(0)}>
            Boulangerie • Pâtisserie artisanale <span className="hero-city">{site.address.city}</span>
          </p>
          <h1 className="hero-title">
            <span className="line"><span className="w" style={v(0)}>L’ART</span></span>
            <span className="line"><span className="w" style={v(1)}>DU PAIN</span></span>
          </h1>
          <div className="hero-foot">
            <p className="hero-tag hero-in" style={v(2)}>{site.tagline}</p>
            <div className="hero-actions hero-in" style={v(3)}>
              <Link href="/gateaux-sur-mesure" className="hero-order hero-order--main">
                <span className="roll">
                  <span>Commander un gâteau</span>
                  <span aria-hidden="true">Commander un gâteau</span>
                </span>
                <span className="arrow" aria-hidden="true">→</span>
              </Link>
              <a href="#creations" className="hero-order hero-order--ghost">
                <span className="roll">
                  <span>Découvrir nos créations</span>
                  <span aria-hidden="true">Découvrir nos créations</span>
                </span>
                <span className="arrow" aria-hidden="true">↓</span>
              </a>
              <a href="#boutique" className="ulink hero-link">
                <span>Nous trouver</span>
              </a>
            </div>
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

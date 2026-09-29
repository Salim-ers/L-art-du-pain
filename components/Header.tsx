"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { useScrollFrame } from "@/lib/scroll";
import { MobileMenu } from "./MobileMenu";

export function Header() {
  const [solid, setSolid] = useState(false);
  const [quick, setQuick] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useScrollFrame((y, vh) => {
    const s = y > vh * 0.72;
    setSolid((p) => (p === s ? p : s));
    const q = y > vh * 0.9;
    setQuick((p) => (p === q ? p : q));
  });

  // Publish the real header height so the hero and anchors can reserve it.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pub = () => {
      if (el.hasAttribute("data-solid")) return;
      document.documentElement.style.setProperty("--hdr", Math.round(el.getBoundingClientRect().height) + "px");
    };
    pub();
    const ro = new ResizeObserver(pub);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      <header ref={ref} className="hdr" data-solid={solid ? "" : undefined}>
        <a href="/#top" className="brand" aria-label={site.name + ", accueil"}>
          <Image src="/images/logo.png" alt="" width={1100} height={1100} priority />
          <span>{site.name}</span>
        </a>
        <nav className="nav" aria-label="Navigation principale">
          {site.nav.map((l) => (
            <a key={l.href} href={l.href} className="nav-link">
              {l.label}
            </a>
          ))}
        </nav>
        <a href="/#boutique" className="hdr-cta">
          <span className="roll">
            <span>Nous trouver →</span>
            <span aria-hidden="true">Nous trouver →</span>
          </span>
        </a>
        <button
          type="button"
          className="burger"
          aria-label="Ouvrir le menu"
          aria-expanded={open}
          aria-controls="menu"
          onClick={() => setOpen(true)}
        >
          <span />
          <span />
        </button>
      </header>

      <MobileMenu open={open} onClose={() => setOpen(false)} />

      <div className="quick" data-show={quick && !open ? "" : undefined}>
        <a href={site.links.directions} target="_blank" rel="noopener noreferrer">Itinéraire ↗</a>
        {site.phone ? <a href={"tel:" + site.phone.tel}>Appeler</a> : <a href="/#boutique">Nous trouver</a>}
      </div>
    </>
  );
}

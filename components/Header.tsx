"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { useScrollFrame } from "@/lib/scroll";
import { useCart } from "./shop/CartProvider";
import { MobileMenu } from "./MobileMenu";

// Pages ouvrant sur une photographie plein écran : l'en-tête y est transparent jusqu'au défilement.
const overHero = (p: string) => p === "/" || p === "/noel" || /^\/evenements\/[^/]+$/.test(p);

export function Header() {
  const pathname = usePathname() || "/";
  const hero = overHero(pathname);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const cart = useCart();
  const [pulse, setPulse] = useState(false);

  useScrollFrame((y, vh) => {
    const s = y > vh * (hero ? 0.72 : 0.02);
    setScrolled((p) => (p === s ? p : s));
  });
  const solid = !hero || scrolled;

  useEffect(() => {
    if (!cart.bump) return;
    setPulse(true);
    const t = window.setTimeout(() => setPulse(false), 700);
    return () => window.clearTimeout(t);
  }, [cart.bump]);

  // Publie la hauteur réelle de l'en-tête (hero, ancres, pages intérieures).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pub = () => {
      if (el.hasAttribute("data-solid") && hero) return;
      document.documentElement.style.setProperty("--hdr", Math.round(el.getBoundingClientRect().height) + "px");
    };
    pub();
    const ro = new ResizeObserver(pub);
    ro.observe(el);
    return () => ro.disconnect();
  }, [hero]);

  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header ref={ref} className="hdr" data-solid={solid ? "" : undefined} data-page={hero ? undefined : ""}>
        <Link href="/" className="brand" aria-label={site.name + ", accueil"}>
          <Image src="/images/logo.png" alt="" width={1100} height={1100} priority />
          <span>{site.name}</span>
        </Link>
        <nav className="nav" aria-label="Navigation principale">
          {site.nav.map((l) => (
            <Link key={l.href} href={l.href} className="nav-link" aria-current={active(l.href) ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hdr-tools">
          <Link href="/compte" className="hdr-icon" aria-label="Mon compte">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.5" r="3.6" /><path d="M4.8 20c.9-3.6 3.8-5.6 7.2-5.6s6.3 2 7.2 5.6" /></svg>
          </Link>
          <Link href="/panier" className="hdr-icon hdr-cart" aria-label={`Panier, ${cart.count} article${cart.count > 1 ? "s" : ""}`} data-pulse={pulse ? "" : undefined}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8Z" /><path d="M9 10V6.5a3 3 0 0 1 6 0V10" /></svg>
            {cart.ready && cart.count > 0 && <span className="hdr-count">{cart.count}</span>}
          </Link>
          <Link href="/commander" className="hdr-cta">
            <span className="roll">
              <span>Commander</span>
              <span aria-hidden="true">Commander</span>
            </span>
          </Link>
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
        </div>
      </header>

      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}

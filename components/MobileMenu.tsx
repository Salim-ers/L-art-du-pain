"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";
import { site } from "@/content/site";

/** Full-screen menu: black curtain drops, large serif entries rise one by one. */
export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const first = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => first.current?.focus(), 300);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const items = [...site.nav, { label: "Nous trouver", href: "/#boutique" }];

  return (
    <div id="menu" className="menu" role="dialog" aria-modal="true" aria-label="Menu" data-open={open ? "" : undefined} aria-hidden={!open}>
      <div className="menu-top">
        <span className="brand">
          <Image src="/images/logo.png" alt="" width={1100} height={1100} />
          <span>{site.name}</span>
        </span>
        <button type="button" className="menu-close" onClick={onClose} aria-label="Fermer le menu" tabIndex={open ? 0 : -1}>
          Fermer
        </button>
      </div>
      <nav className="menu-nav" aria-label="Navigation mobile">
        {items.map((l, i) => (
          <a
            key={l.href}
            ref={i === 0 ? first : undefined}
            href={l.href}
            onClick={onClose}
            tabIndex={open ? 0 : -1}
            className={i === items.length - 1 ? "it terra" : undefined}
            style={{ ["--i" as string]: i } as CSSProperties}
          >
            <span>{l.label}</span>
          </a>
        ))}
      </nav>
      <div className="menu-foot">
        <span>{site.address.street} — {site.address.postalCode} {site.address.city}</span>
        <div className="menu-actions">
          <a href={site.links.directions} target="_blank" rel="noopener noreferrer" tabIndex={open ? 0 : -1}>Itinéraire ↗</a>
          {site.phone && <a href={"tel:" + site.phone.tel} tabIndex={open ? 0 : -1}>{site.phone.display}</a>}
        </div>
      </div>
    </div>
  );
}

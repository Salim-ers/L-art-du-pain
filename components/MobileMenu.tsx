"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { site } from "@/content/site";

/** Menu plein écran : le rideau tombe, les grandes entrées serif montent une à une. */
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

  const tab = open ? 0 : -1;

  return (
    <div id="menu" className="menu" role="dialog" aria-modal="true" aria-label="Menu" data-open={open ? "" : undefined} aria-hidden={!open}>
      <div className="menu-top">
        <span className="brand">
          <Image src="/images/logo.png" alt="" width={1100} height={1100} />
          <span>{site.name}</span>
        </span>
        <button type="button" className="menu-close" onClick={onClose} aria-label="Fermer le menu" tabIndex={tab}>
          Fermer
        </button>
      </div>
      <nav className="menu-nav" aria-label="Navigation complète">
        {site.menu.map((l, i) => (
          <Link
            key={l.href}
            ref={i === 0 ? first : undefined}
            href={l.href}
            onClick={onClose}
            tabIndex={tab}
            className={l.href === "/commander" ? "it terra" : undefined}
            style={{ ["--i" as string]: i } as CSSProperties}
          >
            <span>{l.label}</span>
          </Link>
        ))}
      </nav>
      <div className="menu-foot">
        <div className="menu-actions">
          <Link href="/commander" onClick={onClose} tabIndex={tab}>Commander</Link>
          <Link href="/gateaux-sur-mesure" onClick={onClose} tabIndex={tab}>Commande personnalisée</Link>
        </div>
        <div className="menu-meta">
          <span>{site.address.street} — {site.address.postalCode} {site.address.city}</span>
          <span className="menu-meta-links">
            <a href={site.links.directions} target="_blank" rel="noopener noreferrer" tabIndex={tab}>Itinéraire ↗</a>
            {site.phone && <a href={"tel:" + site.phone.tel} tabIndex={tab}>{site.phone.display}</a>}
            <Link href="/compte" onClick={onClose} tabIndex={tab}>Mon compte</Link>
          </span>
        </div>
      </div>
    </div>
  );
}

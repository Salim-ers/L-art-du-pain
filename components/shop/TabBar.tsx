"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { site } from "@/content/site";
import { useCart } from "./CartProvider";

type Tab = { href: string; label: string; icon: ReactNode; external?: boolean };

const icons = {
  shop: <><path d="M6 8.5c0-2 2.7-3.5 6-3.5s6 1.5 6 3.5" /><path d="M4.5 10h15l-1.3 9.2a1 1 0 0 1-1 .8H6.8a1 1 0 0 1-1-.8z" /></>,
  cake: <><path d="M4.5 20h15v-6.5a1.5 1.5 0 0 0-1.5-1.5H6a1.5 1.5 0 0 0-1.5 1.5z" /><path d="M4.5 16c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0" /><path d="M12 12V8.5M12 6.5v-1" /></>,
  cart: <><path d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8Z" /><path d="M9 10V6.5a3 3 0 0 1 6 0V10" /></>,
  map: <><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.4" /></>,
  phone: <path d="M6.6 4.5h2.7l1.4 3.6-1.8 1.2a10.5 10.5 0 0 0 5.8 5.8l1.2-1.8 3.6 1.4v2.7a1.6 1.6 0 0 1-1.7 1.6C11.1 18.5 5.5 12.9 5 6.2a1.6 1.6 0 0 1 1.6-1.7z" />,
};

/**
 * Barre d'accès rapide (mobile) : découvrir, commander un gâteau, venir, appeler.
 * Le panier n'apparaît que lorsqu'il contient quelque chose. Masquée pendant le paiement.
 */
export function TabBar() {
  const pathname = usePathname() || "/";
  const { count, ready } = useCart();
  if (pathname.startsWith("/commande") && !pathname.startsWith("/commander") && !pathname.startsWith("/commandes-speciales")) return null;
  const tabs: Tab[] = [
    { href: "/commander", label: "Créations", icon: icons.shop },
    { href: "/gateaux-sur-mesure", label: "Gâteau", icon: icons.cake },
    ...(ready && count > 0 ? [{ href: "/panier", label: "Panier", icon: icons.cart }] : []),
    { href: site.links.directions, label: "Itinéraire", icon: icons.map, external: true },
    ...(site.phone ? [{ href: "tel:" + site.phone.tel, label: "Appeler", icon: icons.phone, external: true }] : []),
  ];
  const active = (href: string) => pathname.startsWith(href);
  return (
    <nav className="tabbar" aria-label="Accès rapide" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
      {tabs.map((t) => {
        const inner = (
          <>
            <span className="tab-ico">
              <svg viewBox="0 0 24 24" aria-hidden="true">{t.icon}</svg>
              {t.href === "/panier" && <span className="tab-count">{count}</span>}
            </span>
            <span>{t.label}</span>
          </>
        );
        return t.external ? (
          <a key={t.href} href={t.href} className="tab" {...(t.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {inner}
          </a>
        ) : (
          <Link key={t.href} href={t.href} className="tab" aria-current={active(t.href) ? "page" : undefined}>
            {inner}
          </Link>
        );
      })}
    </nav>
  );
}

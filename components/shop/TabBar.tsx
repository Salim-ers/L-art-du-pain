"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";

const tabs = [
  { href: "/", label: "Accueil", icon: <path d="M4 11.5 12 5l8 6.5V20h-5.5v-5h-5v5H4z" /> },
  { href: "/commander", label: "Commander", icon: <><path d="M6 8.5c0-2 2.7-3.5 6-3.5s6 1.5 6 3.5" /><path d="M4.5 10h15l-1.3 9.2a1 1 0 0 1-1 .8H6.8a1 1 0 0 1-1-.8z" /></> },
  { href: "/panier", label: "Panier", icon: <><path d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8Z" /><path d="M9 10V6.5a3 3 0 0 1 6 0V10" /></> },
  { href: "/compte", label: "Compte", icon: <><circle cx="12" cy="8.5" r="3.6" /><path d="M4.8 20c.9-3.6 3.8-5.6 7.2-5.6s6.3 2 7.2 5.6" /></> },
];

/** Barre d'onglets fixe (mobile). Masquée pendant le paiement pour ne pas couvrir le bouton de validation. */
export function TabBar() {
  const pathname = usePathname() || "/";
  const { count, ready } = useCart();
  if (pathname.startsWith("/commande") && !pathname.startsWith("/commander")) return null;
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <nav className="tabbar" aria-label="Accès rapide">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} className="tab" aria-current={active(t.href) ? "page" : undefined}>
          <span className="tab-ico">
            <svg viewBox="0 0 24 24" aria-hidden="true">{t.icon}</svg>
            {t.href === "/panier" && ready && count > 0 && <span className="tab-count">{count}</span>}
          </span>
          <span>{t.label}</span>
        </Link>
      ))}
    </nav>
  );
}

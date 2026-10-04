import Link from "next/link";
import type { ReactNode } from "react";
import { breadcrumbJsonLd } from "@/lib/schema";
import { JsonLd } from "./JsonLd";
import { Line, Reveal } from "./Reveal";

type Crumb = { name: string; path: string };

/**
 * En-tête éditorial des pages intérieures : fil d'Ariane, grand titre serif révélé par lignes, introduction.
 * `aside` (facultatif) occupe la colonne de droite sur grand écran — une photo par exemple — pour ne pas laisser de vide.
 */
export function PageHero({
  label,
  title,
  intro,
  crumbs,
  children,
  compact,
  aside,
}: {
  label?: string;
  title: ReactNode[];
  intro?: ReactNode;
  crumbs: Crumb[];
  children?: ReactNode;
  compact?: boolean;
  aside?: ReactNode;
}) {
  const all = [{ name: "Accueil", path: "/" }, ...crumbs];
  return (
    <header className={"section phero" + (compact ? " phero--compact" : "") + (aside ? " phero--split" : "")}>
      <JsonLd data={breadcrumbJsonLd(all)} />
      <div className="wrap phero-inner">
        <div className="phero-main">
          <nav className="crumbs" aria-label="Fil d’Ariane">
            <ol>
              {all.map((c, i) => (
                <li key={c.path}>
                  {i < all.length - 1 ? <Link href={c.path}>{c.name}</Link> : <span aria-current="page">{c.name}</span>}
                </li>
              ))}
            </ol>
          </nav>
          {label && <Reveal as="p" className="label">{label}</Reveal>}
          <h1 className="h-xl phero-title">
            {title.map((t, i) => (
              <Line key={i} delay={i * 0.08}>{t}</Line>
            ))}
          </h1>
          {intro && (
            <Reveal as="div" className="phero-intro body" delay={0.16}>
              {intro}
            </Reveal>
          )}
          {children && <Reveal className="phero-actions" delay={0.22}>{children}</Reveal>}
        </div>
        {aside && (
          <Reveal kind="mask" className="phero-aside" delay={0.1}>
            {aside}
          </Reveal>
        )}
      </div>
    </header>
  );
}

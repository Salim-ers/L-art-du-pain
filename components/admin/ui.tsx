"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

type Item = { href: string; label: string; min?: "ADMIN"; badge?: number };

export function Sidebar({ items, user, role }: { items: Item[]; user: string; role: string }) {
  const pathname = usePathname() || "/admin";
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  return (
    <>
      <div className="adm-top">
        <button type="button" className="adm-burger" onClick={() => setOpen(true)} aria-label="Ouvrir le menu">☰</button>
        <Link href="/admin" className="adm-brand">L’Art du Pain <span>Gestion</span></Link>
      </div>
      <aside className="adm-side" data-open={open ? "" : undefined}>
        <div className="adm-side-head">
          <Link href="/admin" className="adm-brand">L’Art du Pain <span>Gestion</span></Link>
          <button type="button" className="adm-close" onClick={() => setOpen(false)} aria-label="Fermer le menu">×</button>
        </div>
        <nav className="adm-nav" aria-label="Administration">
          {items.map((i) => (
            <Link key={i.href} href={i.href} className="adm-link" aria-current={active(i.href) ? "page" : undefined}>
              <span>{i.label}</span>
              {!!i.badge && <span className="adm-pill">{i.badge}</span>}
            </Link>
          ))}
        </nav>
        <div className="adm-user">
          <span className="adm-user-name">{user}</span>
          <span className="adm-user-role">{role}</span>
          <Link href="/" target="_blank" className="adm-user-link">Voir le site ↗</Link>
        </div>
      </aside>
      {open && <div className="adm-scrim" onClick={() => setOpen(false)} />}
    </>
  );
}

/** Messages de retour des actions (?ok= / ?err=), effacés de l'URL après affichage. */
export function Flash() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const ok = params.get("ok");
  const err = params.get("err");
  const [shown, setShown] = useState<{ ok?: string | null; err?: string | null } | null>(null);
  useEffect(() => {
    if (!ok && !err) return;
    setShown({ ok, err });
    const p = new URLSearchParams(params.toString());
    p.delete("ok");
    p.delete("err");
    router.replace(pathname + (p.size ? "?" + p.toString() : ""), { scroll: false });
    const t = window.setTimeout(() => setShown(null), err ? 7000 : 3500);
    return () => window.clearTimeout(t);
  }, [ok, err]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!shown) return null;
  return (
    <div className={"adm-flash" + (shown.err ? " adm-flash--err" : "")} role={shown.err ? "alert" : "status"} onClick={() => setShown(null)}>
      {shown.err ?? shown.ok}
    </div>
  );
}

/** Rafraîchit les données toutes les N secondes (nouvelles commandes) et signale leur nombre dans l'onglet. */
export function AutoRefresh({ seconds = 30, unread = 0 }: { seconds?: number; unread?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => window.clearInterval(t);
  }, [router, seconds]);
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = unread ? `(${unread}) ${base}` : base;
  }, [unread]);
  return null;
}

export function Submit({ children, className = "abtn", confirm, name, value }: { children: ReactNode; className?: string; confirm?: string; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      name={name}
      value={value}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending ? "…" : children}
    </button>
  );
}

export function PrintButton({ label = "Imprimer" }: { label?: string }) {
  return (
    <button type="button" className="abtn abtn--ghost" onClick={() => window.print()}>
      {label}
    </button>
  );
}

/** Lignes de formats (produit) ajoutables côté client. */
export function VariantRows({ initial }: { initial: { id: string; label: string; servings: number | null; price: string }[] }) {
  const [rows, setRows] = useState(initial.length ? initial : []);
  return (
    <div className="avariants">
      {rows.map((r, i) => (
        <div key={r.id || "n" + i} className="avariant">
          <input type="hidden" name="vId" value={r.id} />
          <input name="vLabel" defaultValue={r.label} placeholder="6 personnes" aria-label="Libellé du format" />
          <input name="vServings" defaultValue={r.servings ?? ""} placeholder="Parts" inputMode="numeric" aria-label="Nombre de parts" />
          <input name="vPrice" defaultValue={r.price} placeholder="0,00" inputMode="decimal" aria-label="Prix du format" />
          {r.id ? (
            <label className="acheck"><input type="checkbox" name="vRemove" value={r.id} /> Retirer</label>
          ) : (
            <button type="button" className="abtn abtn--ghost abtn--sm" onClick={() => setRows(rows.filter((_, j) => j !== i))}>×</button>
          )}
        </div>
      ))}
      <button type="button" className="abtn abtn--ghost abtn--sm" onClick={() => setRows([...rows, { id: "", label: "", servings: null, price: "" }])}>
        + Ajouter un format
      </button>
    </div>
  );
}


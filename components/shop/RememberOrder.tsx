"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Saved = { n: string; t: string; kind: "order" | "custom"; at: number; label: string };
const KEY = "adp-orders";

function read(): Saved[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

/** Garde la trace des commandes passées depuis cet appareil (Mon compte). */
export function RememberOrder(o: Omit<Saved, "at">) {
  useEffect(() => {
    try {
      const list = read().filter((x) => x.n !== o.n);
      list.unshift({ ...o, at: Date.now() });
      localStorage.setItem(KEY, JSON.stringify(list.slice(0, 20)));
    } catch {}
  }, [o]);
  return null;
}

export function SavedOrders() {
  const [list, setList] = useState<Saved[] | null>(null);
  useEffect(() => setList(read()), []);
  if (!list) return null;
  if (!list.length) return <p className="body body--sm">Aucune commande enregistrée sur cet appareil.</p>;
  return (
    <ul className="saved">
      {list.map((o) => (
        <li key={o.n}>
          <Link href={(o.kind === "custom" ? "/gateaux-sur-mesure/suivi" : "/commande/suivi") + `?n=${encodeURIComponent(o.n)}&t=${o.t}`}>
            <span className="saved-n">{o.n}</span>
            <span className="saved-l">{o.label}</span>
            <span className="arrow" aria-hidden="true">→</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

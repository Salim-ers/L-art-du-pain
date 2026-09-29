"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

/** Ligne de panier : l'affichage est indicatif, le serveur recalcule prix, stock et disponibilité à la commande. */
export type CartLine = {
  productId: string;
  variantId: string | null;
  quantity: number;
  name: string;
  variantLabel: string | null;
  unitCents: number;
  image: string | null;
  slug: string;
};

type Toast = { id: number; text: string; image: string | null };

type Ctx = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  subtotal: number;
  bump: number;
  add: (l: CartLine) => void;
  setQty: (productId: string, variantId: string | null, qty: number) => void;
  remove: (productId: string, variantId: string | null) => void;
  replace: (lines: CartLine[]) => void;
  clear: () => void;
};

const CartContext = createContext<Ctx | null>(null);
const KEY = "adp-cart-v1";
const same = (a: Pick<CartLine, "productId" | "variantId">, b: Pick<CartLine, "productId" | "variantId">) =>
  a.productId === b.productId && a.variantId === b.variantId;

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [bump, setBump] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<number>();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {}
    setReady(true);
    const sync = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      try {
        setLines(e.newValue ? JSON.parse(e.newValue) : []);
      } catch {}
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, ready]);

  const add = useCallback((l: CartLine) => {
    setLines((prev) => {
      const found = prev.find((x) => same(x, l));
      if (found) return prev.map((x) => (same(x, l) ? { ...x, ...l, quantity: Math.min(50, x.quantity + l.quantity) } : x));
      return [...prev, l];
    });
    setBump((b) => b + 1);
    window.clearTimeout(timer.current);
    setToast({ id: Date.now(), text: `${l.quantity} × ${l.name}${l.variantLabel ? " — " + l.variantLabel : ""}`, image: l.image });
    timer.current = window.setTimeout(() => setToast(null), 3600);
  }, []);

  const setQty = useCallback((productId: string, variantId: string | null, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((x) => !same(x, { productId, variantId }))
        : prev.map((x) => (same(x, { productId, variantId }) ? { ...x, quantity: Math.min(50, qty) } : x))
    );
  }, []);

  const remove = useCallback((productId: string, variantId: string | null) => {
    setLines((prev) => prev.filter((x) => !same(x, { productId, variantId })));
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      lines,
      ready,
      bump,
      count: lines.reduce((t, l) => t + l.quantity, 0),
      subtotal: lines.reduce((t, l) => t + l.quantity * l.unitCents, 0),
      add,
      setQty,
      remove,
      replace: setLines,
      clear: () => setLines([]),
    }),
    [lines, ready, bump, add, setQty, remove]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <div className="toast-zone" aria-live="polite">
        {toast && (
          <div key={toast.id} className="toast" role="status">
            {toast.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={toast.image} alt="" width={48} height={48} />
            )}
            <div className="toast-text">
              <span className="toast-kicker">Ajouté au panier</span>
              <span>{toast.text}</span>
            </div>
            <a href="/panier" className="toast-link">Voir le panier →</a>
          </div>
        )}
      </div>
    </CartContext.Provider>
  );
}

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart hors CartProvider");
  return c;
}

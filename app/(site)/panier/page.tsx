import type { Metadata } from "next";
import { CartView } from "@/components/shop/CartView";

export const metadata: Metadata = { title: "Panier", robots: { index: false, follow: true }, alternates: { canonical: "/panier" } };

export default function PanierPage() {
  return (
    <main id="contenu" className="section flow">
      <div className="wrap">
        <header className="flow-head">
          <p className="label">Étape 1 sur 3</p>
          <h1 className="h-lg">Votre panier</h1>
        </header>
        <CartView />
      </div>
    </main>
  );
}

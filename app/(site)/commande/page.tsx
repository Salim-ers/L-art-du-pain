import type { Metadata } from "next";
import Link from "next/link";
import { Checkout } from "@/components/shop/Checkout";
import { getSetting } from "@/lib/settings";
import { stripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import { ORDERING_CLOSED } from "@/lib/orders";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Finaliser ma commande", robots: { index: false, follow: false } };

export default async function CommandePage({ searchParams }: { searchParams: { annule?: string } }) {
  const [payments, shop] = await Promise.all([getSetting("payments"), getSetting("shop")]);
  return (
    <main id="contenu" className="section flow">
      <div className="wrap">
        <header className="flow-head">
          <Link href="/panier" className="label">← Retour au panier</Link>
          <h1 className="h-lg">Finaliser ma commande</h1>
        </header>
        {env.ephemeralDb ? (
          <p className="notice">{ORDERING_CLOSED}</p>
        ) : (
        <Checkout card={payments.card && !!stripe()} onSite={payments.onSite} step={shop.slotMinutes} cancelled={searchParams.annule === "1"} />
        )}
      </div>
    </main>
  );
}

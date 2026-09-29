import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";

let client: Stripe | null = null;

/** null si Stripe n'est pas configuré : le paiement en ligne est alors masqué. */
export function stripe(): Stripe | null {
  if (!env.stripeSecret) return null;
  client ??= new Stripe(env.stripeSecret, { appInfo: { name: "L’Art du Pain" } });
  return client;
}

export type CheckoutMeta =
  | { kind: "order"; orderId: string; paymentId: string }
  | { kind: "custom"; customOrderId: string; paymentId: string };

/**
 * Session Stripe Checkout : CB, Apple Pay et Google Pay sont proposés automatiquement
 * (moyens de paiement activés dans le tableau de bord Stripe).
 */
export async function createCheckout(opts: {
  label: string;
  description?: string;
  amountCents: number;
  email: string;
  meta: CheckoutMeta;
  successPath: string;
  cancelPath: string;
}) {
  const st = stripe();
  if (!st) throw new Error("Paiement en ligne indisponible.");
  return st.checkout.sessions.create({
    mode: "payment",
    locale: "fr",
    customer_email: opts.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: opts.amountCents,
          product_data: { name: opts.label, ...(opts.description ? { description: opts.description.slice(0, 500) } : {}) },
        },
      },
    ],
    metadata: opts.meta,
    payment_intent_data: { metadata: opts.meta },
    // Le créneau et le stock restent réservés 30 minutes.
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    success_url: env.siteUrl + opts.successPath,
    cancel_url: env.siteUrl + opts.cancelPath,
  });
}

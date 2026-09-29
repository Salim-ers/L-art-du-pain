import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { onCustomPaid } from "@/lib/custom";
import { env } from "@/lib/env";
import { onCheckoutExpired, onOrderPaid } from "@/lib/orders";
import { logError } from "@/lib/security";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/** Webhook Stripe : la signature est vérifiée, le contenu n'est jamais pris sur parole. */
export async function POST(req: Request) {
  const st = stripe();
  if (!st || !env.stripeWebhookSecret) return NextResponse.json({ error: "Stripe non configuré" }, { status: 503 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = st.webhooks.constructEvent(body, req.headers.get("stripe-signature") ?? "", env.stripeWebhookSecret);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object;
      if (session.payment_status !== "paid") return NextResponse.json({ received: true });
      const m = session.metadata ?? {};
      const pi = typeof session.payment_intent === "string" ? session.payment_intent : null;
      const amount = session.amount_total ?? 0;
      if (m.kind === "order" && m.orderId && m.paymentId) await onOrderPaid(m.orderId, m.paymentId, session.id, pi, amount);
      if (m.kind === "custom" && m.customOrderId && m.paymentId) await onCustomPaid(m.customOrderId, m.paymentId, session.id, pi, amount);
    }
    if (event.type === "checkout.session.expired") {
      const m = event.data.object.metadata ?? {};
      if (m.paymentId) await onCheckoutExpired(m.paymentId);
    }
  } catch (e) {
    logError("stripe.webhook", e);
    return NextResponse.json({ error: "Traitement impossible" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}

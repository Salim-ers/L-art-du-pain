"use server";

import { z } from "zod";
import { getDb, schema as s } from "@/lib/db";
import { createCustomOrder, customDays } from "@/lib/custom";
import { findOrderForCustomer, findPromotion, OrderError, placeOrder, priceCart } from "@/lib/orders";
import { limitOrThrow, logError, RateLimitError } from "@/lib/security";
import { notifyStaff } from "@/lib/notify";
import { availableDays, SlotError, type PickupDay } from "@/lib/slots";
import { readImage, savePrivateImage, UploadError } from "@/lib/storage";
import { cartLine, contactInput, customInput, firstError, orderInput, type OrderInput } from "@/lib/validation";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/** Transforme toute erreur en message sûr pour le client (jamais de détail technique). */
function fail(e: unknown, scope: string): { ok: false; error: string } {
  if (e instanceof z.ZodError) return { ok: false, error: firstError(e) };
  if (e instanceof OrderError || e instanceof SlotError || e instanceof RateLimitError || e instanceof UploadError) return { ok: false, error: e.message };
  logError(scope, e);
  return { ok: false, error: "Une erreur est survenue. Merci de réessayer ou de nous appeler." };
}

const linesSchema = z.array(cartLine).max(40);

export type CartCheck = {
  lines: { productId: string; variantId: string | null; name: string; variantLabel: string | null; unitCents: number; image: string | null; slug: string; quantity: number; problem: string | null }[];
  subtotal: number;
  campaign: { name: string; dates: string[] } | null;
  leadHours: number;
};

/** Revalide le panier : prix actuels, disponibilité, stock. */
export async function checkCart(raw: unknown): Promise<Result<{ cart: CartCheck }>> {
  try {
    limitOrThrow("cart", 120, 60);
    const lines = linesSchema.parse(raw);
    const out: CartCheck["lines"] = [];
    for (const l of lines) {
      try {
        const { lines: [p] } = await priceCart([l]);
        out.push({ productId: p.product.id, variantId: p.variantId, name: p.product.name, variantLabel: p.label, unitCents: p.unit, image: p.product.image, slug: p.product.slug, quantity: l.quantity, problem: null });
      } catch (e) {
        out.push({ productId: l.productId, variantId: l.variantId, name: "", variantLabel: null, unitCents: 0, image: null, slug: "", quantity: l.quantity, problem: e instanceof OrderError ? e.message : "Produit indisponible" });
      }
    }
    const valid = out.filter((l) => !l.problem);
    let campaign: CartCheck["campaign"] = null;
    let leadHours = 0;
    if (valid.length) {
      const priced = await priceCart(valid.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity })));
      campaign = priced.campaign ? { name: priced.campaign.name, dates: priced.campaign.dates } : null;
      leadHours = priced.leadHours;
    }
    return { ok: true, cart: { lines: out, subtotal: valid.reduce((t, l) => t + l.unitCents * l.quantity, 0), campaign, leadHours } };
  } catch (e) {
    return fail(e, "checkCart");
  }
}

export async function pickupDays(raw: unknown): Promise<Result<{ days: PickupDay[] }>> {
  try {
    limitOrThrow("slots", 120, 60);
    const lines = linesSchema.min(1).parse(raw);
    const cart = await priceCart(lines);
    const days = await availableDays({ leadHours: cart.leadHours, dates: cart.campaign?.dates ?? null });
    return { ok: true, days };
  } catch (e) {
    return fail(e, "pickupDays");
  }
}

export async function checkPromo(code: string, raw: unknown): Promise<Result<{ discount: number; label: string }>> {
  try {
    limitOrThrow("promo", 20, 300);
    const lines = linesSchema.min(1).parse(raw);
    const cart = await priceCart(lines);
    const r = await findPromotion(z.string().trim().max(40).parse(code), cart.subtotal);
    if (!r) return { ok: false, error: "Saisissez un code." };
    return { ok: true, discount: r.discount, label: r.promo.label };
  } catch (e) {
    return fail(e, "checkPromo");
  }
}

export async function submitOrder(input: OrderInput): Promise<Result<{ redirect: string }>> {
  try {
    limitOrThrow("order", 8, 600);
    const parsed = orderInput.safeParse(input);
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
    const r = await placeOrder(input);
    return { ok: true, redirect: r.redirect };
  } catch (e) {
    return fail(e, "submitOrder");
  }
}

export async function customPickupDays(): Promise<Result<{ days: PickupDay[] }>> {
  try {
    limitOrThrow("slots", 120, 60);
    return { ok: true, days: await customDays() };
  } catch (e) {
    return fail(e, "customDays");
  }
}

export async function submitCustom(fd: FormData): Promise<Result<{ redirect: string }>> {
  try {
    limitOrThrow("custom", 5, 900);
    const parsed = customInput.safeParse({
      occasion: fd.get("occasion"),
      servings: fd.get("servings"),
      cakeType: fd.get("cakeType"),
      flavors: fd.getAll("flavors"),
      message: fd.get("message"),
      desiredDate: fd.get("desiredDate"),
      desiredTime: fd.get("desiredTime"),
      comment: fd.get("comment"),
      firstName: fd.get("firstName"),
      lastName: fd.get("lastName"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      mode: fd.get("mode"),
      acceptTerms: fd.get("acceptTerms") === "on",
    });
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
    const img = await readImage(fd.get("inspiration"));
    const ref = img ? await savePrivateImage(img, "inspiration") : null;
    const r = await createCustomOrder(parsed.data, ref);
    return { ok: true, redirect: r.redirect };
  } catch (e) {
    return fail(e, "submitCustom");
  }
}

export async function submitContact(_: unknown, fd: FormData): Promise<Result | null> {
  try {
    limitOrThrow("contact", 4, 900);
    const parsed = contactInput.safeParse({
      name: fd.get("name"),
      email: fd.get("email"),
      phone: fd.get("phone") ?? "",
      subject: fd.get("subject"),
      body: fd.get("body"),
      website: fd.get("website") ?? "",
    });
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
    const d = parsed.data;
    const db = await getDb();
    await db.insert(s.messages).values({ name: d.name, email: d.email, phone: d.phone || null, subject: d.subject, body: d.body });
    await notifyStaff("message.new", `Nouveau message — ${d.name}`, (d.subject ? d.subject + " — " : "") + d.body.slice(0, 200));
    return { ok: true };
  } catch (e) {
    return fail(e, "contact");
  }
}

/** « Mon compte » : retrouver une commande avec son numéro et l'email utilisé. */
export async function lookupOrder(_: unknown, fd: FormData): Promise<Result<{ redirect: string }> | null> {
  try {
    limitOrThrow("lookup", 10, 900);
    const number = z.string().trim().min(4).max(20).parse(fd.get("number"));
    const email = z.string().trim().toLowerCase().max(160).parse(fd.get("email"));
    const found = await findOrderForCustomer(number, { email });
    if (!found) return { ok: false, error: "Aucune commande ne correspond à ce numéro et cet email." };
    return { ok: true, redirect: `/commande/suivi?n=${encodeURIComponent(found.order.number)}&t=${found.order.accessToken}` };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: "Numéro ou email invalide." };
    return fail(e, "lookup");
  }
}

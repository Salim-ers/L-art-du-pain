/** Schémas Zod partagés : le serveur revalide systématiquement tout ce qui vient du navigateur. */
import { z } from "zod";

// Supprime caractères de contrôle et espaces superflus.
const clean = (v: string) => v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
export const text = (max: number, min = 0) =>
  z.string().transform(clean).pipe(z.string().min(min, min ? "Champ obligatoire" : undefined).max(max, `${max} caractères maximum`));
export const optText = (max: number) =>
  z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? clean(v) : ""))
    .pipe(z.string().max(max, `${max} caractères maximum`))
    .transform((v) => v || null);

export const phone = z
  .string()
  .transform((v) => v.replace(/[\s.\-()]/g, ""))
  .pipe(z.string().regex(/^(\+\d{9,15}|0[1-9]\d{8})$/, "Numéro de téléphone invalide"));
export const email = z.string().trim().toLowerCase().pipe(z.email("Adresse email invalide").max(160));
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide");
export const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure invalide");

export const contactFields = {
  firstName: text(60, 1),
  lastName: text(60, 1),
  email,
  phone,
};

export const cartLine = z.object({
  productId: z.uuid(),
  variantId: z.uuid().nullable(),
  quantity: z.number().int().min(1).max(50),
});

export const orderInput = z.object({
  items: z.array(cartLine).min(1, "Votre panier est vide").max(40),
  pickupDate: isoDate,
  pickupTime: hhmm,
  ...contactFields,
  note: optText(500),
  paymentMethod: z.enum(["card", "on_site"]),
  promoCode: optText(40),
  acceptTerms: z.literal(true, { error: "Merci d’accepter les conditions générales de vente" }),
});
export type OrderInput = z.input<typeof orderInput>;

export const customInput = z.object({
  occasion: text(60, 1),
  servings: text(10, 1),
  cakeType: text(60, 1),
  flavors: z.array(text(60, 1)).min(1, "Choisissez au moins une saveur").max(5),
  message: optText(120),
  desiredDate: isoDate,
  desiredTime: hhmm,
  comment: optText(1500),
  ...contactFields,
  mode: z.enum(["quote", "pay"]),
  acceptTerms: z.literal(true, { error: "Merci d’accepter les conditions générales de vente" }),
});

/** Commande particulière (entreprise, grande quantité, buffet…) : une demande, jamais une commande acceptée d'office. */
export const specialInput = z.object({
  type: text(60, 1),
  desiredDate: isoDate,
  quantity: text(60, 1),
  comment: text(1500, 5),
  ...contactFields,
  // Pot de miel anti-robots : doit rester vide.
  website: z.string().max(0).optional(),
});

export const contactInput = z.object({
  name: text(120, 1),
  email,
  phone: z.union([phone, z.literal("")]).optional(),
  subject: optText(120),
  body: text(3000, 5),
  // Pot de miel anti-robots : doit rester vide.
  website: z.string().max(0).optional(),
});

/** Premier message d'erreur lisible. */
export const firstError = (e: z.ZodError) => e.issues[0]?.message ?? "Données invalides";

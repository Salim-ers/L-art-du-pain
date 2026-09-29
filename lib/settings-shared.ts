/** Paramètres administrables (table `settings`) — types, valeurs par défaut et validation. Aucun import serveur ici. */
import { z } from "zod";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure au format HH:MM");
const range = z.object({ open: time, close: time });

export const shopSchema = z.object({
  // 0 = dimanche … 6 = samedi. Tableau vide = fermé ce jour-là.
  hours: z.array(z.array(range)).length(7),
  slotMinutes: z.number().int().min(5).max(120),
  slotCapacity: z.number().int().min(1).max(200),
  minLeadMinutes: z.number().int().min(0).max(60 * 24 * 7),
  maxDaysAhead: z.number().int().min(1).max(120),
  // Dernier retrait possible X minutes avant la fermeture.
  lastPickupBeforeCloseMinutes: z.number().int().min(0).max(240),
});
export type ShopSettings = z.infer<typeof shopSchema>;

export const paymentSchema = z.object({
  card: z.boolean(),
  onSite: z.boolean(),
  customCakeMode: z.enum(["quote", "pay", "both"]),
  depositPercent: z.number().int().min(0).max(100),
});
export type PaymentSettings = z.infer<typeof paymentSchema>;

export const cakeSchema = z.object({
  occasions: z.array(z.string().min(1).max(60)).min(1),
  servings: z.array(z.string().min(1).max(10)).min(1),
  types: z
    .array(
      z.object({
        id: z.string().min(1).max(60),
        name: z.string().min(1).max(80),
        description: z.string().max(300),
        image: z.string().max(500).nullable(),
        pricePerServingCents: z.number().int().min(0).max(100000),
      })
    )
    .min(1),
  flavors: z.array(z.string().min(1).max(60)).min(1),
  maxFlavors: z.number().int().min(1).max(5),
  minDaysNotice: z.number().int().min(0).max(60),
});
export type CakeSettings = z.infer<typeof cakeSchema>;

export const reviewsSchema = z.object({
  googleReviewUrl: z.string().url().nullable(),
  items: z.array(
    z.object({
      text: z.string().min(1).max(1200),
      author: z.string().min(1).max(80),
      source: z.string().max(40).optional(),
      rating: z.number().int().min(1).max(5).optional(),
    })
  ),
});
export type ReviewsSettings = z.infer<typeof reviewsSchema>;

export const notifySchema = z.object({
  staffEmail: z.string().email().nullable(),
  sendReadyEmail: z.boolean(),
  sendConfirmedEmail: z.boolean(),
});
export type NotifySettings = z.infer<typeof notifySchema>;

const everyDay = Array.from({ length: 7 }, () => [{ open: "06:00", close: "21:00" }]);

export const defaultSettings = {
  shop: {
    hours: everyDay,
    slotMinutes: 15,
    slotCapacity: 4,
    minLeadMinutes: 120,
    maxDaysAhead: 21,
    lastPickupBeforeCloseMinutes: 15,
  } satisfies ShopSettings,
  payments: { card: true, onSite: true, customCakeMode: "both", depositPercent: 30 } satisfies PaymentSettings,
  cake: {
    occasions: ["Anniversaire", "Mariage", "Baptême", "Naissance", "Entreprise", "Fête", "Autre"],
    servings: ["4", "6", "8", "10", "12", "15", "20", "30", "50+"],
    types: [
      { id: "entremets", name: "Entremets", description: "Mousse légère, insert fruité ou croustillant, glaçage miroir.", image: "/images/entremets-coeur.png", pricePerServingCents: 450 },
      { id: "number-cake", name: "Number cake", description: "Chiffres ou lettres en pâte sablée, crème montée et décor frais.", image: "/images/patisseries-collection.png", pricePerServingCents: 500 },
      { id: "layer-cake", name: "Layer cake", description: "Génoise en étages, crème onctueuse, décor sur-mesure.", image: "/images/patisseries-vitrine.png", pricePerServingCents: 480 },
      { id: "fraisier", name: "Fraisier / tarte", description: "Classique de la Maison, selon la saison.", image: "/images/religieuse.png", pricePerServingCents: 420 },
    ],
    flavors: ["Chocolat", "Vanille", "Fruits rouges", "Pistache", "Praliné", "Citron", "Café"],
    maxFlavors: 2,
    minDaysNotice: 3,
  } satisfies CakeSettings,
  reviews: { googleReviewUrl: null, items: [] } satisfies ReviewsSettings,
  notify: { staffEmail: null, sendReadyEmail: true, sendConfirmedEmail: true } satisfies NotifySettings,
};

export type SettingsMap = {
  shop: ShopSettings;
  payments: PaymentSettings;
  cake: CakeSettings;
  reviews: ReviewsSettings;
  notify: NotifySettings;
};
export type SettingsKey = keyof SettingsMap;

export const settingsSchemas: { [K in SettingsKey]: z.ZodType<SettingsMap[K]> } = {
  shop: shopSchema,
  payments: paymentSchema,
  cake: cakeSchema,
  reviews: reviewsSchema,
  notify: notifySchema,
};

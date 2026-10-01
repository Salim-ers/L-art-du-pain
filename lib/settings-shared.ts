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
  // Afficher une estimation de prix au client. Désactivé tant que les tarifs ne sont pas validés par la boutique :
  // le client envoie alors une demande, et la boulangerie confirme le tarif définitif.
  showEstimate: z.boolean().default(false),
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

/**
 * DONNÉES RÉELLES / DONNÉES DE DÉMONSTRATION.
 * Les produits et campagnes marqués `is_demo` (prix, compositions, délais non validés) ne sont visibles
 * que si `demo` est activé. À désactiver au passage en production : seules les données saisies par la boutique restent.
 */
export const catalogSchema = z.object({ demo: z.boolean() });
export type CatalogSettings = z.infer<typeof catalogSchema>;

/** Arguments de réassurance : n'afficher que des engagements réellement vérifiés par la boutique. */
export const reassuranceSchema = z.object({
  items: z.array(z.object({ title: z.string().min(1).max(60), text: z.string().max(200) })).max(6),
});
export type ReassuranceSettings = z.infer<typeof reassuranceSchema>;

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
  payments: { card: true, onSite: true, customCakeMode: "quote", depositPercent: 30 } satisfies PaymentSettings,
  cake: {
    occasions: ["Anniversaire", "Mariage", "Baptême", "Naissance", "Entreprise", "Fête", "Autre"],
    servings: ["4", "6", "8", "10", "12", "15", "20", "30", "50+"],
    types: [
      { id: "entremets", name: "Entremets", description: "Mousse légère, insert fruité ou croustillant, glaçage miroir.", image: null, pricePerServingCents: 450 },
      { id: "number-cake", name: "Number cake", description: "Chiffres ou lettres en pâte sablée, crème montée et décor frais.", image: null, pricePerServingCents: 500 },
      { id: "layer-cake", name: "Layer cake", description: "Génoise en étages, crème onctueuse, décor sur-mesure.", image: null, pricePerServingCents: 480 },
      { id: "fraisier", name: "Fraisier / tarte", description: "Classique de la Maison, selon la saison.", image: null, pricePerServingCents: 420 },
    ],
    flavors: ["Chocolat", "Vanille", "Fruits rouges", "Pistache", "Praliné", "Citron", "Café"],
    maxFlavors: 2,
    minDaysNotice: 3,
    showEstimate: false,
  } satisfies CakeSettings,
  reviews: { googleReviewUrl: null, items: [] } satisfies ReviewsSettings,
  notify: { staffEmail: null, sendReadyEmail: true, sendConfirmedEmail: true } satisfies NotifySettings,
  catalog: { demo: true } satisfies CatalogSettings,
  // Uniquement ce que le site garantit lui-même (retrait programmé, commandes sur demande) : le reste se saisit dans la gestion.
  reassurance: {
    items: [
      { title: "Retrait en boutique", text: "Vous choisissez le jour et l’heure : votre commande vous attend au comptoir." },
      { title: "Sur commande", text: "Gâteaux personnalisés et grandes quantités, préparés à votre demande." },
    ],
  } satisfies ReassuranceSettings,
};

export type SettingsMap = {
  shop: ShopSettings;
  payments: PaymentSettings;
  cake: CakeSettings;
  reviews: ReviewsSettings;
  notify: NotifySettings;
  catalog: CatalogSettings;
  reassurance: ReassuranceSettings;
};
export type SettingsKey = keyof SettingsMap;

export const settingsSchemas: { [K in SettingsKey]: z.ZodType<SettingsMap[K]> } = {
  shop: shopSchema,
  payments: paymentSchema,
  cake: cakeSchema,
  reviews: reviewsSchema,
  notify: notifySchema,
  catalog: catalogSchema,
  reassurance: reassuranceSchema,
};

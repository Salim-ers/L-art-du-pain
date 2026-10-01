import type { CustomStatus, OrderStatus, PaymentStatus } from "@/lib/db/schema";

export const orderStatusLabel: Record<OrderStatus, string> = {
  new: "Nouvelle",
  confirmed: "Confirmée",
  to_prepare: "À préparer",
  in_preparation: "En préparation",
  ready: "Prête",
  collected: "Récupérée",
  cancelled: "Annulée",
};

export const orderFlow: OrderStatus[] = ["new", "confirmed", "to_prepare", "in_preparation", "ready", "collected"];

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  pending: "Paiement en attente",
  paid: "Payé",
  partially_paid: "Acompte payé",
  on_site: "Paiement sur place",
  refunded: "Remboursé",
  failed: "Échec du paiement",
};

export const customStatusLabel: Record<CustomStatus, string> = {
  pending: "À valider",
  quote_sent: "Devis envoyé",
  changes_requested: "Modification demandée",
  accepted: "Acceptée",
  refused: "Refusée",
  cancelled: "Annulée",
};

/** Étapes visibles par le client. */
export const customerSteps: { key: OrderStatus[]; label: string }[] = [
  { key: ["new"], label: "Reçue" },
  { key: ["confirmed", "to_prepare"], label: "Confirmée" },
  { key: ["in_preparation"], label: "En préparation" },
  { key: ["ready"], label: "Prête" },
  { key: ["collected"], label: "Récupérée" },
];

export const ALLERGENS = [
  "Gluten",
  "Crustacés",
  "Œufs",
  "Poissons",
  "Arachides",
  "Soja",
  "Lait",
  "Fruits à coque",
  "Céleri",
  "Moutarde",
  "Sésame",
  "Sulfites",
  "Lupin",
  "Mollusques",
];

import { site } from "./site";

/** Questions fréquentes (affichées sur les pages et balisées FAQPage). */
export const clickCollectFaq = [
  {
    q: "Comment fonctionne le Click & Collect ?",
    a: "Ajoutez vos produits au panier, choisissez un jour et un créneau de retrait, puis réglez en ligne ou en boutique. Votre commande vous attend à l’heure choisie à L’Art du Pain, 28 Avenue Saint-Exupéry à Nogent-sur-Oise.",
  },
  {
    q: "Combien de temps à l’avance faut-il commander ?",
    a: "Pour le pain, les viennoiseries et les pâtisseries du jour, quelques heures suffisent. Les gâteaux à partager demandent 24 heures, les bûches et créations de fêtes 48 heures. Les créneaux proposés tiennent compte automatiquement de ces délais.",
  },
  {
    q: "Puis-je payer sur place ?",
    a: "Oui, lorsque l’option est proposée au moment de la commande. Vous pouvez aussi régler en ligne par carte bancaire, Apple Pay ou Google Pay.",
  },
  {
    q: "Comment modifier ou annuler ma commande ?",
    a: `Appelez-nous${site.phone ? " au " + site.phone.display : ""} en précisant votre numéro de commande. Nous ferons le nécessaire tant que la préparation n’a pas commencé.`,
  },
];

export const customFaq = [
  {
    q: "Combien de temps à l’avance commander un gâteau personnalisé ?",
    a: "Comptez au minimum quelques jours ; pour un mariage ou une grande pièce, contactez-nous plusieurs semaines avant. Le calendrier du configurateur n’affiche que les dates encore possibles.",
  },
  {
    q: "Puis-je envoyer une photo d’inspiration ?",
    a: "Oui : joignez une image (JPG, PNG ou WEBP). Elle nous aide à comprendre le style, les couleurs et le décor souhaités. Elle reste privée et n’est vue que par l’équipe.",
  },
  {
    q: "Le prix affiché est-il définitif ?",
    a: "Le configurateur affiche une estimation. Selon le décor demandé, la Maison peut vous proposer un devis ajusté avant confirmation.",
  },
  {
    q: "Faut-il verser un acompte ?",
    a: "Un acompte peut être demandé pour confirmer la commande. Le solde se règle en boutique au moment du retrait.",
  },
];

export const christmasFaq = [
  {
    q: "Jusqu’à quand commander sa bûche de Noël ?",
    a: "Les précommandes restent ouvertes jusqu’à la date de clôture indiquée sur la page, ou jusqu’à ce que la collection soit complète.",
  },
  {
    q: "Quand retirer ma bûche ?",
    a: "Vous choisissez le jour et le créneau de retrait parmi les dates proposées pour les fêtes, directement lors de la commande.",
  },
  {
    q: "Pour combien de personnes ?",
    a: "Nos bûches existent en 4, 6 et 8 personnes. Le prix s’ajuste automatiquement selon le format choisi.",
  },
];

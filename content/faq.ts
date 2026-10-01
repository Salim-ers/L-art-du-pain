import { site } from "./site";

/**
 * Questions fréquentes (affichées sur les pages et balisées FAQPage).
 * Aucune information commerciale inventée : délais, prix et moyens de paiement sont ceux affichés au moment de la commande.
 */
export const clickCollectFaq = [
  {
    q: "Que peut-on commander en ligne ?",
    a: "Les gâteaux, les créations de saison et les produits signalés comme commandables. Le reste se découvre en boutique ; pour une grande quantité, utilisez la page « Commandes particulières ».",
  },
  {
    q: "Combien de temps à l’avance faut-il commander ?",
    a: "Cela dépend du produit. Les jours et heures de retrait proposés tiennent compte automatiquement du délai de préparation.",
  },
  {
    q: "Comment se passe le retrait ?",
    a: `Vous choisissez un jour et un créneau ; votre commande vous attend à ${site.name}, ${site.address.street} à ${site.address.city}.`,
  },
  {
    q: "Comment modifier ou annuler ma commande ?",
    a: `Appelez-nous${site.phone ? " au " + site.phone.display : ""} en précisant votre numéro de commande.`,
  },
];

export const customFaq = [
  {
    q: "Ma demande est-elle une commande ?",
    a: "Pas encore. Nous étudions votre demande, puis nous vous confirmons la faisabilité et le tarif définitif par email ou par téléphone.",
  },
  {
    q: "Combien de temps à l’avance faire ma demande ?",
    a: "Le calendrier du configurateur n’affiche que les dates encore possibles. Pour un mariage ou une grande pièce, prenez contact le plus tôt possible.",
  },
  {
    q: "Puis-je envoyer une photo d’inspiration ?",
    a: "Oui : joignez une image (JPG, PNG ou WEBP). Elle nous aide à comprendre le style, les couleurs et le décor souhaités, et n’est vue que par l’équipe.",
  },
];

export const christmasFaq = [
  {
    q: "Jusqu’à quand précommander ?",
    a: "Les précommandes restent ouvertes jusqu’à la date de clôture indiquée sur la page, ou jusqu’à ce que la collection soit complète.",
  },
  {
    q: "Quand retirer ma commande ?",
    a: "Vous choisissez le jour et le créneau de retrait parmi les dates proposées pour les fêtes, au moment de la commande.",
  },
];

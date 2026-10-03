/**
 * Modèles d'événements : un clic crée une campagne en brouillon (non publiée), à compléter
 * (produits, dates de précommande et de retrait) puis à activer depuis Gestion → Événements.
 * Les textes sont génériques : aucune date ni aucun produit n'est inventé.
 */
export const eventTemplates = [
  { kind: "noel", label: "Noël", headline: "Nos créations de Noël", subtitle: "À précommander pour les fêtes." },
  { kind: "nouvel-an", label: "Nouvel An", headline: "Pour le Nouvel An", subtitle: "Desserts et plateaux à précommander." },
  { kind: "epiphanie", label: "Épiphanie", headline: "Galettes des rois", subtitle: "À réserver pour l’Épiphanie." },
  { kind: "saint-valentin", label: "Saint-Valentin", headline: "Pour la Saint-Valentin", subtitle: "Des douceurs à partager." },
  { kind: "ramadan", label: "Ramadan", headline: "Pour le Ramadan", subtitle: "Pâtisseries et pains à précommander." },
  { kind: "aid-el-fitr", label: "Aïd el-Fitr", headline: "Pour l’Aïd el-Fitr", subtitle: "Plateaux et gâteaux à précommander." },
  { kind: "aid-el-adha", label: "Aïd el-Adha", headline: "Pour l’Aïd el-Adha", subtitle: "Plateaux et gâteaux à précommander." },
  { kind: "paques", label: "Pâques", headline: "Pour Pâques", subtitle: "Les créations de Pâques à précommander." },
  { kind: "fete-des-meres", label: "Fête des mères", headline: "Pour la fête des mères", subtitle: "Un gâteau pour la dire autrement." },
  { kind: "fete-des-peres", label: "Fête des pères", headline: "Pour la fête des pères", subtitle: "Un gâteau pour le dire autrement." },
] as const;

/** Types proposés dans le formulaire d'un événement. */
export const eventKinds: [string, string][] = [...eventTemplates.map((t) => [t.kind, t.label] as [string, string]), ["mariages", "Mariages"], ["custom", "Autre"]];

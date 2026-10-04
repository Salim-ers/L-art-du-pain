/**
 * Photographies du site — une photo = un seul emplacement.
 *
 * `boutique` : vraies photos de L’Art du Pain (boutique, comptoir, créations réellement fabriquées).
 * `univers`  : photos libres de droits (licence Unsplash : usage commercial autorisé, sans attribution obligatoire).
 *              Elles illustrent le métier et les familles de produits, JAMAIS un produit précis présenté comme vendu ici.
 *
 * `width` / `height` : dimensions réelles du fichier source — une image n'est jamais affichée plus grande que sa source.
 * Une photo ajoutée depuis la gestion (catégorie, produit, galerie) remplace toujours ces visuels.
 */
export type Photo = {
  src: string;
  alt: string;
  width: number;
  height: number;
  source: "boutique" | "univers";
  credit?: { author: string; url: string };
};

export const photos = {
  // Vraies photos de la boutique
  interior: { src: "/images/boutique-interieur.png", alt: "L’intérieur de la boutique L’Art du Pain à Nogent-sur-Oise", width: 1672, height: 941, source: "boutique" },
  counter: { src: "/images/boutique.png", alt: "Le comptoir et la vitrine de L’Art du Pain", width: 1145, height: 1374, source: "boutique" },
  pastries: { src: "/images/patisseries-collection.png", alt: "Éclair, chou pistache et entremets individuels de L’Art du Pain", width: 1448, height: 1086, source: "boutique" },
  savoury: { src: "/images/sale.png", alt: "Snacking salé servi à L’Art du Pain", width: 1390, height: 1132, source: "boutique" },
  heartCake: { src: "/images/entremets-coeur.png", alt: "Entremets en forme de cœur réalisé par L’Art du Pain", width: 1254, height: 1254, source: "boutique" },

  // Univers du métier (libres de droits)
  baguettes: {
    src: "/images/univers/pains-baguettes.jpg",
    alt: "Baguettes dorées à la croûte grignée",
    width: 1800,
    height: 2400,
    source: "univers",
    credit: { author: "Joost Crop", url: "https://unsplash.com/photos/6x0BG2emMuU" },
  },
  croissants: {
    src: "/images/univers/viennoiseries-croissants.jpg",
    alt: "Croissants feuilletés sur une plaque de cuisson",
    width: 2200,
    height: 1467,
    source: "univers",
    credit: { author: "Conor Brown", url: "https://unsplash.com/photos/sqkXyyj4WdE" },
  },
} satisfies Record<string, Photo>;

/** Visuel d'une famille de produits sur l'accueil, à défaut d'une photo ajoutée depuis la gestion. */
export const familyPhotos: Record<string, Photo> = {
  pains: photos.baguettes,
  viennoiseries: photos.croissants,
  patisseries: photos.pastries,
  sale: photos.savoury,
};

/** Photo envoyée depuis la gestion (stockée en base) : prioritaire sur les visuels par défaut. */
export const isUploaded = (src: string | null | undefined): src is string => !!src && src.startsWith("/api/img/");

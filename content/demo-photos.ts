/**
 * PHOTOS D’EXEMPLE (mode démonstration uniquement) — photos libres de droits (licence Unsplash, hors Unsplash+),
 * pour illustrer les produits, campagnes et styles de gâteaux d’exemple tant que la boutique n’a pas fourni les siens.
 * Elles ne s’affichent qu’avec des données marquées « Exemple » et disparaissent avec le mode démonstration.
 * Une photo ajoutée depuis la gestion les remplace toujours.
 */
import type { Photo } from "./photos";

/** Par identifiant de produit (slug) d’exemple. */
export const demoProductPhotos: Record<string, Photo> = {
  "baguette-tradition": { src: "/images/exemples/baguette-tradition.jpg", alt: "Exemple : baguette tradition", width: 1600, height: 1097, source: "univers", credit: { author: "Sergio Arze", url: "https://unsplash.com/photos/cWXibBbXx44" } },
  "baguette": { src: "/images/exemples/baguette.jpg", alt: "Exemple : baguette", width: 1600, height: 2133, source: "univers", credit: { author: "Joshua Woroniecki", url: "https://unsplash.com/photos/6c65NYGVv5k" } },
  "pain-complet": { src: "/images/exemples/pain-complet.jpg", alt: "Exemple : pain complet", width: 1600, height: 1067, source: "univers", credit: { author: "Jude Infantini", url: "https://unsplash.com/photos/rYOqbTcGp1c" } },
  "pain-aux-cereales": { src: "/images/exemples/pain-aux-cereales.jpg", alt: "Exemple : pain aux céréales", width: 1600, height: 992, source: "univers", credit: { author: "Sergio Arze", url: "https://unsplash.com/photos/8JGA8LZv9i4" } },
  "pain-de-campagne": { src: "/images/exemples/pain-de-campagne.jpg", alt: "Exemple : pain de campagne", width: 1600, height: 2400, source: "univers", credit: { author: "Maria Orlova", url: "https://unsplash.com/photos/kU7TkW9FIJY" } },
  "croissant": { src: "/images/exemples/croissant.jpg", alt: "Exemple : croissant", width: 1600, height: 1200, source: "univers", credit: { author: "Vicky Nguyen", url: "https://unsplash.com/photos/a4xoMVKzbak" } },
  "pain-au-chocolat": { src: "/images/exemples/pain-au-chocolat.jpg", alt: "Exemple : pain au chocolat", width: 1600, height: 2000, source: "univers", credit: { author: "jonathan ocampo", url: "https://unsplash.com/photos/CUbyC8PxPB4" } },
  "pain-aux-raisins": { src: "/images/exemples/pain-aux-raisins.jpg", alt: "Exemple : viennoiserie roulée", width: 1600, height: 2400, source: "univers", credit: { author: "Aurela Redenica", url: "https://unsplash.com/photos/DeLJxhQQwMA" } },
  "chausson-aux-pommes": { src: "/images/exemples/chausson-aux-pommes.jpg", alt: "Exemple : feuilletés", width: 1600, height: 1067, source: "univers", credit: { author: "Ben Stein", url: "https://unsplash.com/photos/1QDNaIYlKVo" } },
  "religieuse-chocolat": { src: "/images/exemples/religieuse-chocolat.jpg", alt: "Exemple : choux", width: 1600, height: 1067, source: "univers", credit: { author: "AnaCristina Smith", url: "https://unsplash.com/photos/AP1yxr7Ekw0" } },
  "eclair-chocolat": { src: "/images/exemples/eclair-chocolat.jpg", alt: "Exemple : éclairs", width: 1600, height: 900, source: "univers", credit: { author: "Razvan Mirel", url: "https://unsplash.com/photos/tas-1lvQE6Q" } },
  "tarte-au-citron": { src: "/images/exemples/tarte-au-citron.jpg", alt: "Exemple : tarte au citron meringuée", width: 1600, height: 1248, source: "univers", credit: { author: "Vincent Toesca", url: "https://unsplash.com/photos/VDEHbTEKGxY" } },
  "mille-feuille": { src: "/images/exemples/mille-feuille.jpg", alt: "Exemple : mille-feuille", width: 1600, height: 1049, source: "univers", credit: { author: "amirali mirhashemian", url: "https://unsplash.com/photos/ZYtbCrOoiDU" } },
  "paris-brest": { src: "/images/exemples/paris-brest.jpg", alt: "Exemple : paris-brest", width: 1600, height: 1818, source: "univers", credit: { author: "Christian Agbede", url: "https://unsplash.com/photos/cB3IP8hbyhE" } },
  "entremets-individuel": { src: "/images/exemples/entremets-individuel.jpg", alt: "Exemple : entremets en couches", width: 1600, height: 2400, source: "univers", credit: { author: "Christine Tan", url: "https://unsplash.com/photos/rZ82EhwIJUM" } },
  "entremets-chocolat": { src: "/images/exemples/entremets-chocolat.jpg", alt: "Exemple : entremets au chocolat", width: 1600, height: 2400, source: "univers", credit: { author: "Diana Light", url: "https://unsplash.com/photos/-4ccYKuvc5A" } },
  "fraisier": { src: "/images/exemples/fraisier.jpg", alt: "Exemple : fraisier", width: 1600, height: 1108, source: "univers", credit: { author: "amirali mirhashemian", url: "https://unsplash.com/photos/cZFU60dKB6U" } },
  "tarte-aux-fruits-de-saison": { src: "/images/exemples/tarte-aux-fruits-de-saison.jpg", alt: "Exemple : tarte aux fruits", width: 1600, height: 2397, source: "univers", credit: { author: "Frosty Ilze", url: "https://unsplash.com/photos/lD0JFJDXBfQ" } },
  "sandwich-jambon-beurre": { src: "/images/exemples/sandwich-jambon-beurre.jpg", alt: "Exemple : sandwich baguette", width: 1600, height: 1067, source: "univers", credit: { author: "Ola Mishchenko", url: "https://unsplash.com/photos/XqYlvd5DGKA" } },
  "panini": { src: "/images/exemples/panini.jpg", alt: "Exemple : panini", width: 1600, height: 1067, source: "univers", credit: { author: "jack shingai", url: "https://unsplash.com/photos/hdhWH1xoYwM" } },
  "quiche-lorraine": { src: "/images/exemples/quiche-lorraine.jpg", alt: "Exemple : quiche", width: 1600, height: 1067, source: "univers", credit: { author: "Taylor Walling", url: "https://unsplash.com/photos/t_cbBvwE3aQ" } },
  "pizza": { src: "/images/exemples/pizza.jpg", alt: "Exemple : pizza", width: 1600, height: 2400, source: "univers", credit: { author: "Klara Kulikova", url: "https://unsplash.com/photos/jvWZYnxBDlQ" } },
  "formule-dejeuner": { src: "/images/exemples/formule-dejeuner.jpg", alt: "Exemple : sandwichs du midi", width: 1600, height: 1994, source: "univers", credit: { author: "Eiliv Aceron", url: "https://unsplash.com/photos/Z7X1PPL_r2k" } },
  "cookie": { src: "/images/exemples/cookie.jpg", alt: "Exemple : cookies", width: 1600, height: 2001, source: "univers", credit: { author: "Food Photographer | Jennifer Pallian", url: "https://unsplash.com/photos/OfdDiqx8Cz8" } },
  "brownie": { src: "/images/exemples/brownie.jpg", alt: "Exemple : brownies", width: 1600, height: 2416, source: "univers", credit: { author: "Anna Przepiorka", url: "https://unsplash.com/photos/LjtviHokbr4" } },
  "financier": { src: "/images/exemples/financier.jpg", alt: "Exemple : financiers", width: 1600, height: 2306, source: "univers", credit: { author: "Luna Hu", url: "https://unsplash.com/photos/g6-zftnM7VM" } },
  "ballotin-de-chocolats": { src: "/images/exemples/ballotin-de-chocolats.jpg", alt: "Exemple : boîte de chocolats", width: 1600, height: 1067, source: "univers", credit: { author: "Igor Lifar", url: "https://unsplash.com/photos/DPNrBT1WCMs" } },
  "buche-chocolat-praline": { src: "/images/exemples/buche-chocolat-praline.jpg", alt: "Exemple : bûche au chocolat", width: 1600, height: 2400, source: "univers", credit: { author: "Alex Diffor", url: "https://unsplash.com/photos/Hr8H_yNDju0" } },
  "buche-vanille-fruits-rouges": { src: "/images/exemples/buche-vanille-fruits-rouges.jpg", alt: "Exemple : bûche de noël", width: 1600, height: 2174, source: "univers", credit: { author: "Jill Heyer", url: "https://unsplash.com/photos/toxlLueLNDs" } },
  "buche-pistache-griotte": { src: "/images/exemples/buche-pistache-griotte.jpg", alt: "Exemple : biscuit roulé", width: 1600, height: 2240, source: "univers", credit: { author: "Kristo Markou", url: "https://unsplash.com/photos/mkbXStDviG8" } },
  "buche-traditionnelle-cafe": { src: "/images/exemples/buche-traditionnelle-cafe.jpg", alt: "Exemple : bûche roulée", width: 1600, height: 2416, source: "univers", credit: { author: "Frederick Medina", url: "https://unsplash.com/photos/Y-xHy0eJxxc" } },
  "galette-des-rois-frangipane": { src: "/images/exemples/galette-des-rois-frangipane.jpg", alt: "Exemple : tourte feuilletée", width: 1600, height: 1067, source: "univers", credit: { author: "Rob Wicks", url: "https://unsplash.com/photos/XiVAtKb0ZR8" } },
};

/** Par identifiant de style de gâteau (Paramètres → Gâteaux sur mesure). */
export const demoCakeTypePhotos: Record<string, Photo> = {
  "entremets": { src: "/images/exemples/type-entremets.jpg", alt: "Exemple : entremets glacé", width: 1600, height: 1068, source: "univers", credit: { author: "Bohdan Stocek", url: "https://unsplash.com/photos/YBYN5X26duQ" } },
  "layer-cake": { src: "/images/exemples/type-layer-cake.jpg", alt: "Exemple : layer cake", width: 1600, height: 1067, source: "univers", credit: { author: "Jasmine Bartel", url: "https://unsplash.com/photos/8LtrMQfeDkQ" } },
  "fraisier": { src: "/images/exemples/type-fraisier.jpg", alt: "Exemple : tarte aux fraises", width: 1600, height: 1067, source: "univers", credit: { author: "Reuben Mcfeeters", url: "https://unsplash.com/photos/qnCzQRAoIr4" } },
  "number-cake": { src: "/images/exemples/type-number-cake.jpg", alt: "Exemple : gâteau au chiffre", width: 1600, height: 2400, source: "univers", credit: { author: "Joyful", url: "https://unsplash.com/photos/NnPYcSxFXqU" } },
};

/** Par identifiant (slug) de campagne d’exemple. */
export const demoCampaignPhotos: Record<string, Photo> = {
  "noel": { src: "/images/exemples/event-noel.jpg", alt: "Exemple : pâtisseries de noël", width: 1600, height: 2400, source: "univers", credit: { author: "Rob Wicks", url: "https://unsplash.com/photos/YTenXvIu4DI" } },
  "epiphanie": { src: "/images/exemples/event-epiphanie.jpg", alt: "Exemple : couronne des rois", width: 1600, height: 1080, source: "univers", credit: { author: "Pasquale Farro", url: "https://unsplash.com/photos/plIiannXZiI" } },
};

/** Par famille sans visuel propre. */
export const demoFamilyPhotos: Record<string, Photo> = {
  "gourmandises": { src: "/images/exemples/cat-gourmandises.jpg", alt: "Exemple : macarons", width: 1600, height: 2025, source: "univers", credit: { author: "Heather Barnes", url: "https://unsplash.com/photos/WbZesfqwR-A" } },
};

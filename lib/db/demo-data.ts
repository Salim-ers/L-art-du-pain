/**
 * DONNÉES DE DÉMONSTRATION — produits, prix, compositions, allergènes, délais, stocks et campagnes INVENTÉS
 * pour présenter le fonctionnement du site. Ils sont enregistrés avec `is_demo = true` et ne s'affichent que
 * lorsque le mode démonstration est activé (Gestion → Paramètres). Ne jamais les présenter comme de vraies informations.
 */
export type SeedProduct = {
  name: string;
  price: number;
  short?: string;
  description?: string;
  composition?: string;
  image?: string | null;
  allergens?: string[];
  variants?: [label: string, servings: number, price: number][];
  featured?: boolean;
  seasonal?: boolean;
  lead?: number;
  stock?: number;
  vat?: number;
};

export const G = "Gluten", L = "Lait", O = "Œufs", N = "Fruits à coque", SO = "Soja", SE = "Sésame", M = "Moutarde";

export const demoProducts: Record<string, SeedProduct[]> = {
  pains: [
      { name: "Baguette tradition", price: 140, short: "Farine Label Rouge, fermentation lente, croûte fine et craquante.", allergens: [G], featured: true },
      { name: "Baguette", price: 120, short: "La baguette du quotidien, dorée à point.", allergens: [G] },
      { name: "Pain complet", price: 260, short: "Farine complète, mie dense et parfumée.", allergens: [G] },
      { name: "Pain aux céréales", price: 290, short: "Graines de lin, tournesol, sésame et millet.", allergens: [G, SE] },
      { name: "Pain de campagne", price: 320, short: "Au levain, pour les tartines et les belles tablées.", allergens: [G] },
  ],
  viennoiseries: [
      { name: "Croissant", price: 130, short: "Pur beurre, feuilletage croustillant.", allergens: [G, L, O], featured: true, stock: 60 },
      { name: "Pain au chocolat", price: 140, short: "Deux barres de chocolat noir, feuilletage doré.", allergens: [G, L, O, SO], stock: 60 },
      { name: "Pain aux raisins", price: 170, short: "Crème pâtissière et raisins moelleux.", allergens: [G, L, O] },
      { name: "Chausson aux pommes", price: 180, short: "Compotée de pommes, feuilletage caramélisé.", allergens: [G, L, O] },
  ],
  patisseries: [
      { name: "Religieuse chocolat", price: 360, short: "Pâte à choux, crème onctueuse, glaçage chocolat.", description: "Deux choux garnis d’une crème pâtissière au chocolat, glaçage brillant, collerette de crème au beurre.", allergens: [G, L, O], featured: true },
      { name: "Éclair chocolat", price: 320, short: "Crème pâtissière chocolat noir.", allergens: [G, L, O] },
      { name: "Tarte au citron", price: 380, short: "Sablé breton, crémeux citron, meringue italienne.", allergens: [G, L, O] },
      { name: "Mille-feuille", price: 390, short: "Feuilletage caramélisé, crème vanille.", allergens: [G, L, O] },
      { name: "Paris-Brest", price: 420, short: "Choux croustillant, crème mousseline pralinée.", allergens: [G, L, O, N] },
      { name: "Entremets individuel", price: 450, short: "Création du moment, selon la saison.", allergens: [G, L, O] },
  ],
  gateaux: [
      { name: "Entremets chocolat", price: 2400, short: "Mousse chocolat noir, croustillant praliné.", allergens: [G, L, O, N], variants: [["4 personnes", 4, 1800], ["6 personnes", 6, 2400], ["8 personnes", 8, 3200]], lead: 24 },
      { name: "Fraisier", price: 2600, short: "Génoise, crème mousseline, fraises fraîches (en saison).", allergens: [G, L, O], variants: [["4 personnes", 4, 2000], ["6 personnes", 6, 2600], ["8 personnes", 8, 3400]], lead: 24 },
      { name: "Tarte aux fruits de saison", price: 2200, short: "Pâte sablée, crème d’amande, fruits frais.", allergens: [G, L, O, N], variants: [["6 personnes", 6, 2200], ["8 personnes", 8, 2900]], lead: 24 },
  ],
  sale: [
      { name: "Sandwich jambon-beurre", price: 450, short: "Baguette tradition, jambon supérieur, beurre doux.", allergens: [G, L], vat: 1000 },
      { name: "Panini", price: 500, short: "Jambon, fromage ou poulet curry.", allergens: [G, L, M], vat: 1000 },
      { name: "Quiche lorraine", price: 380, short: "Pâte brisée maison, lardons, crème.", allergens: [G, L, O], vat: 1000 },
      { name: "Pizza", price: 350, short: "Sur pâte à pain, garniture du jour.", allergens: [G, L], vat: 1000 },
      { name: "Formule déjeuner", price: 890, short: "Sandwich ou salade + boisson + dessert.", allergens: [G, L, O], vat: 1000 },
  ],
  gourmandises: [
      { name: "Cookie", price: 220, short: "Pépites de chocolat, cœur fondant.", allergens: [G, L, O, SO] },
      { name: "Brownie", price: 260, short: "Chocolat noir et noix de pécan.", allergens: [G, L, O, N] },
      { name: "Financier", price: 120, short: "Beurre noisette et poudre d’amande.", allergens: [G, L, O, N] },
      { name: "Ballotin de chocolats", price: 1800, short: "Assortiment de chocolats, 250 g.", allergens: [L, N, SO], vat: 2000 },
  ],
  fetes: [
      {
        name: "Bûche Chocolat Praliné",
        price: 3900,
        short: "Mousse chocolat noir, cœur praliné, croustillant noisette.",
        description: "Une mousse au chocolat noir intense, un cœur praliné coulant et un croustillant aux noisettes torréfiées. Décor chocolat façonné à la main.",
        composition: "Biscuit chocolat, croustillant praliné noisette, crémeux praliné, mousse chocolat noir 64 %, glaçage cacao.",
        allergens: [G, L, O, N, SO],
        variants: [["4 personnes", 4, 2800], ["6 personnes", 6, 3900], ["8 personnes", 8, 5200]],
        seasonal: true,
        lead: 48,
        stock: 40,
      },
      {
        name: "Bûche Vanille Fruits rouges",
        price: 3900,
        short: "Mousse vanille de Madagascar, insert fruits rouges.",
        composition: "Biscuit amande, compotée de framboises et griottes, mousse vanille, glaçage blanc.",
        allergens: [G, L, O, N],
        variants: [["4 personnes", 4, 2800], ["6 personnes", 6, 3900], ["8 personnes", 8, 5200]],
        seasonal: true,
        lead: 48,
        stock: 30,
      },
      {
        name: "Bûche Pistache Griotte",
        price: 4200,
        short: "Mousse pistache, cœur griotte, sablé croustillant.",
        composition: "Sablé breton, crémeux pistache, confit de griottes, mousse pistache.",
        allergens: [G, L, O, N],
        variants: [["4 personnes", 4, 3000], ["6 personnes", 6, 4200], ["8 personnes", 8, 5600]],
        seasonal: true,
        lead: 48,
        stock: 25,
      },
      {
        name: "Bûche traditionnelle Café",
        price: 3600,
        short: "Biscuit roulé, crème au beurre café.",
        allergens: [G, L, O],
        variants: [["4 personnes", 4, 2600], ["6 personnes", 6, 3600], ["8 personnes", 8, 4800]],
        seasonal: true,
        lead: 48,
      },
      {
        name: "Galette des rois frangipane",
        price: 2200,
        short: "Feuilletage pur beurre, frangipane amande.",
        allergens: [G, L, O, N],
        variants: [["4 personnes", 4, 1600], ["6 personnes", 6, 2200], ["8 personnes", 8, 2900]],
        seasonal: true,
        lead: 24,
      },
  ],
};

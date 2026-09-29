/**
 * L’ART DU PAIN — contenu central du site.
 * Toute information affichée vient d’ici. Modifiez ce fichier, rien d’autre.
 * Règle : une valeur `null` ou un tableau vide = l’élément n’est PAS affiché
 * (aucune information inventée n’est publiée).
 */

export type Img = { src: string | null; alt: string; placeholder?: string };
export type GalleryFormat = "wide" | "portrait" | "square" | "landscape" | "medium";
export type Review = { text: string; author: string; source?: string; date?: string };

export type SiteContent = {
  name: string;
  url: string;
  tagline: string;
  seo: { title: string; description: string; keywords: string[]; ogImage: string };
  address: { street: string; postalCode: string; city: string; region: string; country: string };
  geo: { lat: number; lng: number } | null;
  phone: { display: string; tel: string } | null;
  hours: {
    display: string;
    schema: { days: string[]; opens: string; closes: string }[];
  } | null;
  social: { instagram: string | null; facebook: string | null };
  links: { directions: string; maps: string };
  hero: { image: string | null; imageAlt: string; video: string | null };
  nav: { label: string; href: string }[];
  manifesto: { label: string; title: string[]; paragraphs: string[] };
  editorial: { label: string; title: string[]; text: string; main: Img; detail: Img };
  creations: { label: string; title: string[]; intro: string };
  categories: { id: string; title: string; image: Img; href?: string }[];
  signature: {
    label: string;
    name: string;
    description: string;
    note: string | null;
    image: Img;
  } | null;
  marquee: string[];
  craft: { label: string; title: [string, string]; steps: { title: string; image: Img }[] };
  immersive: { image: Img; words: string[] };
  breath: string[];
  gallery: { caption: string; format: GalleryFormat; image: Img }[];
  reviews: Review[];
  legal: { publisher: string | null; siret: string | null; host: string };
};

const ADDRESS_QUERY = encodeURIComponent("L'Art du Pain, 28 Avenue Saint-Exupéry, 60180 Nogent-sur-Oise");

export const site: SiteContent = {
  name: "L’Art du Pain",
  // ⚠️ À remplacer par le vrai nom de domaine avant mise en ligne (canonical, sitemap, OpenGraph).
  url: "https://www.lartdupain-nogent.fr",
  tagline: "Le savoir-faire artisanal, façonné chaque jour.",

  seo: {
    title: "L’Art du Pain | Boulangerie artisanale à Nogent-sur-Oise",
    description:
      "L’Art du Pain, boulangerie et pâtisserie artisanale à Nogent-sur-Oise. Pains, viennoiseries, pâtisseries et salé façonnés chaque jour, 28 Avenue Saint-Exupéry.",
    keywords: [
      "Boulangerie Nogent-sur-Oise",
      "Boulangerie artisanale Nogent-sur-Oise",
      "Pâtisserie Nogent-sur-Oise",
      "L’Art du Pain Nogent-sur-Oise",
    ],
    ogImage: "/images/boutique-interieur.png",
  },

  address: {
    street: "28 Avenue Saint-Exupéry",
    postalCode: "60180",
    city: "Nogent-sur-Oise",
    region: "Hauts-de-France",
    country: "FR",
  },
  // Coordonnées GPS exactes de la boutique (active le pin sur la carte + Schema.org). null = non renseigné.
  geo: null,

  phone: { display: "03 65 65 89 09", tel: "+33365658909" },

  hours: {
    display: "Tous les jours, 6h00 — 21h00",
    schema: [
      {
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "06:00",
        closes: "21:00",
      },
    ],
  },

  // Renseignez l’URL complète, ex. "https://www.instagram.com/lartdupain60"
  social: { instagram: null, facebook: null },

  links: {
    directions: "https://www.google.com/maps/dir/?api=1&destination=" + ADDRESS_QUERY,
    maps: "https://www.google.com/maps/search/?api=1&query=" + ADDRESS_QUERY,
  },

  hero: {
    image: "/images/boutique-interieur.png",
    imageAlt: "Intérieur de la boutique L’Art du Pain à Nogent-sur-Oise",
    // Vidéo de fond : déposez /public/video/hero.mp4 puis mettez "/video/hero.mp4"
    video: null,
  },

  nav: [
    { label: "La Maison", href: "/#maison" },
    { label: "Nos créations", href: "/#creations" },
    { label: "Le savoir-faire", href: "/#geste" },
    { label: "Galerie", href: "/#galerie" },
  ],

  manifesto: {
    label: "01 — La Maison",
    title: ["Il suffit parfois de farine,", "d’eau, de temps", "et de passion."],
    paragraphs: [
      "Ici, rien ne va plus vite que la pâte. Les fournées suivent les heures, la fermentation prend son temps, la croûte se forme lentement. Nous travaillons peu de gestes, mais nous les travaillons bien.",
      "Une boulangerie de quartier, à Nogent-sur-Oise, où l’exigence n’est pas une posture : c’est simplement la manière de faire. Le pain du matin, la viennoiserie du dimanche, la pâtisserie que l’on rapporte — le quotidien mérite aussi l’exigence.",
    ],
  },

  editorial: {
    label: "La matière",
    title: ["Doré chaque matin,", "façonné ici."],
    text: "Une farine, de l’eau, du sel, du levain ou de la levure. Le reste est une affaire de température, d’attention et de répétition.",
    main: { src: "/images/entremets-coeur.png", alt: "Entremets en forme de cœur, L’Art du Pain" },
    detail: { src: "/images/patisseries-collection.png", alt: "Plateau de pâtisseries de la Maison" },
  },

  creations: {
    label: "02 — Les créations",
    title: ["Chaque envie", "a son moment."],
    intro: "Cinq familles, une même exigence. Survolez pour entrevoir.",
  },

  // Retirez une entrée si la catégorie n’existe pas réellement en boutique.
  categories: [
    { id: "pains", title: "Les Pains", image: { src: "/images/pains.png", alt: "Baguettes dorées" } },
    { id: "viennoiseries", title: "Les Viennoiseries", image: { src: "/images/viennoiseries.png", alt: "Croissants et pains au chocolat" } },
    { id: "patisseries", title: "Les Pâtisseries", image: { src: "/images/patisseries-vitrine.png", alt: "Vitrine de pâtisseries" } },
    { id: "sale", title: "Le Salé", image: { src: "/images/sale.png", alt: "Snacking salé" } },
    { id: "gourmandises", title: "Les Gourmandises", image: { src: "/images/entremets-coeur.png", alt: "Entremets cœur" } },
  ],

  signature: {
    label: "La création du moment",
    name: "La Religieuse",
    description: "Pâte à choux, crème onctueuse, glaçage chocolat. Signée du sceau de la Maison.",
    note: "Composition, allergènes et prix — à confirmer par la Maison",
    image: { src: "/images/religieuse.png", alt: "Religieuse au chocolat, sceau L’Art du Pain" },
  },

  marquee: ["Façonné", "Doré", "Croustillant", "Chaque jour"],

  craft: {
    label: "03 — Le geste",
    title: ["Derrière chaque", "création, "],
    steps: [
      { title: "Pétrir", image: { src: null, alt: "Pétrissage", placeholder: "Photo — mains dans la farine" } },
      { title: "Façonner", image: { src: null, alt: "Façonnage", placeholder: "Photo — façonnage du pâton" } },
      { title: "Laisser le temps", image: { src: null, alt: "Pousse", placeholder: "Photo — pousse en bannetons" } },
      { title: "Cuire", image: { src: null, alt: "Cuisson", placeholder: "Photo — enfournement, buée" } },
      { title: "Partager", image: { src: null, alt: "Comptoir", placeholder: "Photo — comptoir, échange" } },
    ],
  },

  immersive: {
    image: { src: null, alt: "Le fournil", placeholder: "Photo plein écran — plan large du fournil" },
    words: ["La matière.", "Le geste.", "Le temps.", "La précision.", "Le goût."],
  },

  breath: ["Faire simple.", "Le faire bien.", "Tous les jours."],

  gallery: [
    { caption: "L’intérieur", format: "wide", image: { src: "/images/boutique-interieur.png", alt: "Intérieur de la boutique" } },
    { caption: "Les pains", format: "portrait", image: { src: "/images/pains.png", alt: "Baguettes" } },
    { caption: "La collection", format: "wide", image: { src: "/images/patisseries-collection.png", alt: "Plateau de pâtisseries" } },
    { caption: "Viennoiseries", format: "landscape", image: { src: "/images/viennoiseries.png", alt: "Croissants et pains au chocolat" } },
    { caption: "Le salé", format: "medium", image: { src: "/images/sale.png", alt: "Snacking salé" } },
    { caption: "La Religieuse", format: "square", image: { src: "/images/religieuse.png", alt: "Religieuse au chocolat" } },
    { caption: "La vitrine", format: "landscape", image: { src: "/images/patisseries-vitrine.png", alt: "Vitrine de pâtisseries" } },
    { caption: "La boutique", format: "wide", image: { src: "/images/boutique.png", alt: "La boutique L’Art du Pain" } },
  ],

  // Uniquement de VRAIS avis (Google, etc.). Tableau vide = section masquée.
  // Exemple : { text: "…", author: "Prénom N.", source: "Google" }
  reviews: [],

  legal: {
    publisher: null, // Raison sociale + forme juridique
    siret: null,
    host: "Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
  },
};

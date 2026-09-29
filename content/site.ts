/**
 * L’ART DU PAIN — contenu éditorial et identité (NAP) du site.
 * Le catalogue, les campagnes, la galerie, les avis et les horaires de retrait sont gérés depuis /admin.
 * Règle : une valeur `null` ou un tableau vide = l’élément n’est PAS affiché (aucune information inventée n’est publiée).
 * ⚠️ Nom, adresse et téléphone doivent rester STRICTEMENT identiques à la fiche Google Business Profile.
 */

export type Img = { src: string | null; alt: string; placeholder?: string };
export type GalleryFormat = "wide" | "portrait" | "square" | "landscape" | "medium";

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
  links: { directions: string; maps: string; waze: string; review: string };
  hero: { image: string | null; imageAlt: string; video: string | null };
  nav: { label: string; href: string }[];
  menu: { label: string; href: string }[];
  manifesto: { label: string; title: string[]; paragraphs: string[] };
  editorial: { label: string; title: string[]; text: string; main: Img; detail: Img };
  creations: { label: string; title: string[]; intro: string };
  marquee: string[];
  craft: { label: string; title: [string, string]; intro: string; steps: { title: string; text: string; image: Img }[] };
  immersive: { image: Img; words: string[] };
  breath: string[];
  local: { title: string; paragraphs: string[]; towns: { name: string; text: string }[] };
  legal: { publisher: string | null; siret: string | null; host: string };
};

const ADDRESS = "28 Avenue Saint-Exupéry, 60180 Nogent-sur-Oise";
const ADDRESS_QUERY = encodeURIComponent("L'Art du Pain, " + ADDRESS);
const GEO = null as SiteContent["geo"]; // ex. { lat: 49.27xx, lng: 2.46xx } — active le pin exact (carte, Waze, Schema.org)

export const site: SiteContent = {
  name: "L’Art du Pain",
  // ⚠️ À remplacer par le vrai nom de domaine avant mise en ligne (canonical, sitemap, OpenGraph).
  url: process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.lartdupain-nogent.fr",
  tagline: "Le savoir-faire artisanal, façonné chaque jour.",

  seo: {
    title: "L’Art du Pain | Boulangerie pâtisserie artisanale à Nogent-sur-Oise",
    description:
      "L’Art du Pain, boulangerie pâtisserie artisanale à Nogent-sur-Oise, près de Creil. Pains, viennoiseries, pâtisseries, gâteaux sur mesure et bûches de Noël. Commande en ligne et Click & Collect.",
    keywords: [
      "Boulangerie Nogent-sur-Oise",
      "Boulangerie pâtisserie Nogent-sur-Oise",
      "Pâtisserie Nogent-sur-Oise",
      "Boulangerie près de Creil",
      "Gâteau anniversaire Nogent-sur-Oise",
      "Click & Collect boulangerie Nogent-sur-Oise",
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
  geo: GEO,

  phone: { display: "03 65 65 89 09", tel: "+33365658909" },

  // Affichage + Schema.org. Les créneaux de retrait suivent les horaires définis dans /admin/parametres.
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
    waze: GEO
      ? `https://waze.com/ul?ll=${GEO.lat},${GEO.lng}&navigate=yes`
      : "https://waze.com/ul?q=" + encodeURIComponent(ADDRESS) + "&navigate=yes",
    // Remplacé par le lien « Laisser un avis » de la fiche Google, s’il est renseigné dans /admin/parametres.
    review: "https://www.google.com/maps/search/?api=1&query=" + ADDRESS_QUERY,
  },

  hero: {
    image: "/images/boutique-interieur.png",
    imageAlt: "Intérieur de la boutique L’Art du Pain à Nogent-sur-Oise",
    // Vidéo de fond : déposez /public/video/hero.mp4 puis mettez "/video/hero.mp4"
    video: null,
  },

  // Barre de navigation (bureau)
  nav: [
    { label: "La Maison", href: "/la-maison" },
    { label: "Nos créations", href: "/nos-creations" },
    { label: "Sur mesure", href: "/gateaux-sur-mesure" },
    { label: "Noël", href: "/noel" },
    { label: "Galerie", href: "/galerie" },
    { label: "Nous trouver", href: "/nous-trouver" },
  ],

  // Menu complet (plein écran)
  menu: [
    { label: "Accueil", href: "/" },
    { label: "La Maison", href: "/la-maison" },
    { label: "Nos créations", href: "/nos-creations" },
    { label: "Commander", href: "/commander" },
    { label: "Gâteaux sur mesure", href: "/gateaux-sur-mesure" },
    { label: "Événements", href: "/evenements" },
    { label: "Noël & Fêtes", href: "/noel" },
    { label: "Galerie", href: "/galerie" },
    { label: "Notre savoir-faire", href: "/savoir-faire" },
    { label: "Nous trouver", href: "/nous-trouver" },
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
    intro: "Sept familles, une même exigence. Survolez pour entrevoir, cliquez pour commander.",
  },

  marquee: ["Façonné", "Doré", "Croustillant", "Chaque jour"],

  craft: {
    label: "03 — Le geste",
    title: ["Derrière chaque", "création, "],
    intro:
      "Pas de raccourci : la pâte est pétrie, façonnée et cuite sur place, au rythme qu’elle impose. Voici les cinq temps qui font un pain, une viennoiserie ou un gâteau de la Maison.",
    steps: [
      { title: "Pétrir", text: "Farine, eau, sel, levain : le pétrissage donne sa structure à la pâte.", image: { src: null, alt: "Pétrissage", placeholder: "Photo — mains dans la farine" } },
      { title: "Façonner", text: "Chaque pâton est façonné à la main, un par un.", image: { src: null, alt: "Façonnage", placeholder: "Photo — façonnage du pâton" } },
      { title: "Laisser le temps", text: "La fermentation développe les arômes : elle ne se presse pas.", image: { src: null, alt: "Pousse", placeholder: "Photo — pousse en bannetons" } },
      { title: "Cuire", text: "Four chaud, buée, croûte qui se forme et chante en refroidissant.", image: { src: null, alt: "Cuisson", placeholder: "Photo — enfournement, buée" } },
      { title: "Partager", text: "Au comptoir, le matin, pour vous.", image: { src: null, alt: "Comptoir", placeholder: "Photo — comptoir, échange" } },
    ],
  },

  immersive: {
    image: { src: null, alt: "Le fournil", placeholder: "Photo plein écran — plan large du fournil" },
    words: ["La matière.", "Le geste.", "Le temps.", "La précision.", "Le goût."],
  },

  breath: ["Faire simple.", "Le faire bien.", "Tous les jours."],

  local: {
    title: "Boulangerie pâtisserie à Nogent-sur-Oise",
    paragraphs: [
      "L’Art du Pain est installée au 28 Avenue Saint-Exupéry, à Nogent-sur-Oise. Chaque jour, nous y préparons pains, viennoiseries, pâtisseries et snacking salé, du premier croissant du matin à la baguette du soir.",
      "Pour gagner du temps, commandez en ligne et retirez en boutique à l’heure de votre choix : c’est notre Click & Collect. Pour un anniversaire, un baptême ou un événement d’entreprise, nous réalisons aussi des gâteaux personnalisés, et chaque hiver une collection de bûches de Noël à précommander.",
    ],
    towns: [
      { name: "Nogent-sur-Oise", text: "La boutique, au 28 Avenue Saint-Exupéry." },
      { name: "Creil", text: "Juste de l’autre côté de l’Oise : commandez avant de passer." },
      { name: "Montataire", text: "Un détour rapide pour vos commandes du week-end." },
      { name: "Villers-Saint-Paul", text: "Gâteaux d’anniversaire et bûches à retirer sans attendre." },
      { name: "Monchy-Saint-Éloi", text: "Pain et viennoiseries réservés, prêts à votre arrivée." },
    ],
  },

  legal: {
    publisher: null, // Raison sociale + forme juridique
    siret: null,
    host: "Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
  },
};

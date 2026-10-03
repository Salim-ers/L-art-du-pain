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
  tagline: "Du pain du matin aux gâteaux des grands jours.",

  seo: {
    title: "L’Art du Pain | Boulangerie pâtisserie artisanale à Nogent-sur-Oise",
    description:
      "L’Art du Pain, boulangerie pâtisserie artisanale à Nogent-sur-Oise, près de Creil. Gâteaux personnalisés, commandes pour vos événements et créations de fêtes, à retirer en boutique.",
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
    { label: "Créations", href: "/commander" },
    { label: "Sur mesure", href: "/gateaux-sur-mesure" },
    { label: "Événements", href: "/evenements" },
    { label: "Galerie", href: "/galerie" },
    { label: "Contact", href: "/nous-trouver" },
  ],

  // Menu complet (plein écran)
  menu: [
    { label: "Accueil", href: "/" },
    { label: "Nos créations", href: "/commander" },
    { label: "Gâteaux sur mesure", href: "/gateaux-sur-mesure" },
    { label: "Commandes particulières", href: "/commandes-speciales" },
    { label: "Événements & fêtes", href: "/evenements" },
    { label: "Galerie", href: "/galerie" },
    { label: "Contact", href: "/nous-trouver" },
  ],

  local: {
    title: "Boulangerie pâtisserie à Nogent-sur-Oise",
    paragraphs: [
      "L’Art du Pain est une boulangerie pâtisserie du 28 Avenue Saint-Exupéry, à Nogent-sur-Oise, à quelques minutes de Creil, Montataire et Villers-Saint-Paul.",
      "Pour un anniversaire, un baptême ou un événement d’entreprise, faites votre demande de gâteau personnalisé en ligne et retirez-le en boutique au jour choisi. Petits-déjeuners, buffets, grandes quantités : faites-nous une demande, nous revenons vers vous.",
    ],
    towns: [
      { name: "Nogent-sur-Oise", text: "La boutique, au 28 Avenue Saint-Exupéry." },
      { name: "Creil", text: "Juste de l’autre côté de l’Oise : commandez avant de passer." },
      { name: "Montataire", text: "Un détour rapide pour vos commandes du week-end." },
      { name: "Villers-Saint-Paul", text: "Votre gâteau d’anniversaire à retirer à l’heure choisie." },
      { name: "Monchy-Saint-Éloi", text: "À quelques minutes, pour vos commandes d’événements." },
    ],
  },

  legal: {
    publisher: null, // Raison sociale + forme juridique
    siret: null,
    host: "Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
  },
};

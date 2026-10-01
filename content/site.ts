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
    { label: "Nos produits", href: "/commander" },
    { label: "Sur mesure", href: "/gateaux-sur-mesure" },
    { label: "Noël", href: "/noel" },
    { label: "Galerie", href: "/galerie" },
    { label: "Nous trouver", href: "/nous-trouver" },
  ],

  // Menu complet (plein écran)
  menu: [
    { label: "Accueil", href: "/" },
    { label: "Commander", href: "/commander" },
    { label: "Gâteaux sur mesure", href: "/gateaux-sur-mesure" },
    { label: "Événements", href: "/evenements" },
    { label: "Noël & Fêtes", href: "/noel" },
    { label: "Galerie", href: "/galerie" },
    { label: "Nous trouver", href: "/nous-trouver" },
  ],

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

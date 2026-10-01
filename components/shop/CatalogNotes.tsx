import Link from "next/link";
import type { ProductView } from "@/lib/catalog";

/** Mention obligatoire dès qu'une donnée d'exemple est affichée : elle ne doit jamais passer pour une vraie offre. */
export function DemoNote({ products }: { products: Pick<ProductView, "demo">[] }) {
  if (!products.some((p) => p.demo)) return null;
  return (
    <p className="demo-note" role="note">
      <strong>Exemples :</strong> les produits marqués « Exemple », leurs prix et leurs descriptions illustrent le fonctionnement du site.
      Ils ne constituent pas la carte de la boutique.
    </p>
  );
}

/** Famille vendue en boutique (commande en ligne fermée) : orienter vers une demande pour les grandes quantités. */
export function StoreNote() {
  return (
    <div className="store-note">
      <p>Ces produits se découvrent en boutique. Pour une grande quantité, un plateau ou un buffet, faites-nous une demande : nous préparons tout pour la date choisie.</p>
      <Link href="/commandes-speciales" className="btn btn--dark">Faire une demande</Link>
    </div>
  );
}

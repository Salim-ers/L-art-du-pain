import Link from "next/link";
import type { Category } from "@/lib/db/schema";

/** Onglets de catégories (collants sous l'en-tête, défilables au doigt). */
export function CategoryTabs({ categories, current }: { categories: Category[]; current: string | null }) {
  return (
    <nav className="ctabs" aria-label="Catégories">
      <div className="ctabs-track">
        <Link href="/commander" className="ctab" aria-current={current === null ? "page" : undefined}>
          Tout
        </Link>
        {categories.map((c) => (
          <Link key={c.id} href={"/commander/" + c.slug} className="ctab" aria-current={current === c.slug ? "page" : undefined}>
            {c.name}
          </Link>
        ))}
        <Link href="/gateaux-sur-mesure" className="ctab ctab--accent">
          Sur mesure
        </Link>
      </div>
    </nav>
  );
}

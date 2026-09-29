import { asc, eq } from "drizzle-orm";
import { PageTitle } from "@/components/admin/bits";
import { Submit } from "@/components/admin/ui";
import { getDb, schema as s } from "@/lib/db";
import { resetDailyStock, saveStock } from "../../actions";

export const metadata = { title: "Stock" };

export default async function StockPage({ searchParams }: { searchParams: { cat?: string } }) {
  const db = await getDb();
  const [cats, products, variants, inv] = await Promise.all([
    db.select().from(s.categories).orderBy(asc(s.categories.position)),
    db.select().from(s.products).where(eq(s.products.active, true)).orderBy(asc(s.products.position), asc(s.products.name)),
    db.select().from(s.productVariants).where(eq(s.productVariants.active, true)).orderBy(asc(s.productVariants.position)),
    db.select().from(s.inventory),
  ]);
  const rows = products
    .filter((p) => !searchParams.cat || p.categoryId === searchParams.cat)
    .flatMap((p) => {
      const vs = variants.filter((v) => v.productId === p.id);
      return (vs.length ? vs.map((v) => ({ p, v })) : [{ p, v: null }]).map(({ p, v }) => ({
        p,
        v,
        inv: inv.find((i) => i.productId === p.id && i.variantId === (v?.id ?? null)) ?? null,
      }));
    });

  return (
    <>
      <PageTitle title="Stock" sub="Illimité par défaut. En stock limité, le produit passe « Épuisé » à zéro et ne peut plus être commandé.">
        <form action={resetDailyStock}>
          <input type="hidden" name="back" value="/admin/stock" />
          <Submit className="abtn" confirm="Remettre chaque stock du jour à sa valeur de référence ?">Réinitialiser le stock du jour</Submit>
        </form>
      </PageTitle>
      <form className="afilters" action="/admin/stock">
        <select name="cat" defaultValue={searchParams.cat ?? ""} aria-label="Catégorie">
          <option value="">Toutes les catégories</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="abtn" type="submit">Filtrer</button>
      </form>
      <div className="atable-wrap">
        <table className="atable">
          <thead><tr><th>Produit</th><th>Mode</th><th>Stock actuel</th><th>Stock du jour (référence)</th><th /></tr></thead>
          <tbody>
            {rows.map(({ p, v, inv: i }) => (
              <tr key={p.id + (v?.id ?? "")}>
                <td className="strong">{p.name}{v && <span className="amuted"> — {v.label}</span>}</td>
                <td colSpan={4}>
                  <form action={saveStock} className="astock-form">
                    <input type="hidden" name="back" value={"/admin/stock" + (searchParams.cat ? "?cat=" + searchParams.cat : "")} />
                    <input type="hidden" name="productId" value={p.id} />
                    {v && <input type="hidden" name="variantId" value={v.id} />}
                    <select name="mode" defaultValue={i?.tracked ? "limited" : "unlimited"} aria-label="Mode de stock">
                      <option value="unlimited">Illimité</option>
                      <option value="limited">Limité</option>
                    </select>
                    <input type="number" name="quantity" min={0} defaultValue={i?.quantity ?? 0} aria-label="Stock actuel" className={i?.tracked && i.quantity <= 3 ? "alow" : ""} />
                    <input type="number" name="dailyQuantity" min={0} defaultValue={i?.dailyQuantity ?? ""} placeholder="—" aria-label="Stock du jour" />
                    <Submit className="abtn abtn--ghost abtn--sm">Enregistrer</Submit>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

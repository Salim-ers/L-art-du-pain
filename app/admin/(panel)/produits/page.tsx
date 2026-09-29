/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { Empty, PageTitle } from "@/components/admin/bits";
import { Submit } from "@/components/admin/ui";
import { requirePage } from "@/lib/auth/session";
import { getDb, schema as s } from "@/lib/db";
import { money } from "@/lib/format";
import { toggleProduct } from "../../actions";

export const metadata = { title: "Produits" };

export default async function ProductsPage({ searchParams }: { searchParams: { cat?: string; q?: string } }) {
  await requirePage("ADMIN");
  const db = await getDb();
  const [cats, rows, variants] = await Promise.all([
    db.select().from(s.categories).orderBy(asc(s.categories.position)),
    db.select().from(s.products).orderBy(asc(s.products.position), asc(s.products.name)),
    db.select().from(s.productVariants).where(eq(s.productVariants.active, true)),
  ]);
  const q = searchParams.q?.toLowerCase().trim();
  const list = rows.filter((p) => (!searchParams.cat || p.categoryId === searchParams.cat) && (!q || p.name.toLowerCase().includes(q)));
  return (
    <>
      <PageTitle title="Produits" sub={`${rows.length} produits · ${rows.filter((p) => p.active).length} visibles`}>
        <Link href="/admin/produits/nouveau" className="abtn">+ Créer un produit</Link>
      </PageTitle>
      <form className="afilters" action="/admin/produits">
        <input name="q" defaultValue={searchParams.q} placeholder="Rechercher un produit" aria-label="Rechercher" />
        <select name="cat" defaultValue={searchParams.cat ?? ""} aria-label="Catégorie">
          <option value="">Toutes les catégories</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="abtn" type="submit">Filtrer</button>
      </form>
      {list.length ? (
        <div className="atable-wrap">
          <table className="atable">
            <thead><tr><th /><th>Produit</th><th>Catégorie</th><th className="num">Prix</th><th>Options</th><th>État</th><th /></tr></thead>
            <tbody>
              {list.map((p) => {
                const vs = variants.filter((v) => v.productId === p.id);
                return (
                  <tr key={p.id} className={p.active ? "" : "aoff"}>
                    <td className="athumb">{p.image ? <img src={p.image} alt="" /> : <span />}</td>
                    <td><Link href={"/admin/produits/" + p.id} className="alink strong">{p.name}</Link></td>
                    <td>{cats.find((c) => c.id === p.categoryId)?.name ?? "—"}</td>
                    <td className="num">{vs.length ? vs.map((v) => money(v.priceCents)).join(" / ") : money(p.priceCents)}</td>
                    <td className="atags">
                      {p.featured && <span className="atag">Mis en avant</span>}
                      {p.seasonal && <span className="atag">Saison</span>}
                      {!p.orderable && <span className="atag">Non commandable</span>}
                      {!p.clickCollect && <span className="atag">Hors C&C</span>}
                      {p.leadTimeHours > 0 && <span className="atag">{p.leadTimeHours} h</span>}
                    </td>
                    <td>{p.active ? "Visible" : "Désactivé"}</td>
                    <td>
                      <form action={toggleProduct}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="back" value="/admin/produits" />
                        <Submit className="abtn abtn--ghost abtn--sm">{p.active ? "Désactiver" : "Activer"}</Submit>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>Aucun produit.</Empty>
      )}
    </>
  );
}

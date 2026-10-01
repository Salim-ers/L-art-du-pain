/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { Card, PageTitle } from "@/components/admin/bits";
import { Submit, VariantRows } from "@/components/admin/ui";
import { requirePage } from "@/lib/auth/session";
import { getDb, schema as s } from "@/lib/db";
import { ALLERGENS } from "@/lib/labels";
import { ImageInput } from "@/components/admin/ImageInput";
import { saveProduct } from "../../../actions";

export const metadata = { title: "Produit" };

const euros = (c: number) => (c / 100).toFixed(2).replace(".", ",");

export default async function ProductForm({ params }: { params: { id: string } }) {
  await requirePage("ADMIN");
  const db = await getDb();
  const isNew = params.id === "nouveau";
  if (!isNew && !/^[0-9a-f-]{36}$/.test(params.id)) notFound();
  const [p] = isNew ? [null] : await db.select().from(s.products).where(eq(s.products.id, params.id));
  if (!isNew && !p) notFound();
  const [cats, variants] = await Promise.all([
    db.select().from(s.categories).orderBy(asc(s.categories.position)),
    p ? db.select().from(s.productVariants).where(and(eq(s.productVariants.productId, p.id), eq(s.productVariants.active, true))).orderBy(asc(s.productVariants.position)) : [],
  ]);
  const back = isNew ? "/admin/produits/nouveau" : "/admin/produits/" + p!.id;

  return (
    <>
      <PageTitle title={isNew ? "Nouveau produit" : p!.name} sub={<Link href="/admin/produits" className="alink">← Tous les produits</Link>}>
        {p && <Link href={"/produit/" + p.slug} target="_blank" className="abtn abtn--ghost">Voir sur le site ↗</Link>}
      </PageTitle>
      <form action={saveProduct} className="agrid">
        <input type="hidden" name="back" value={back} />
        {p && <input type="hidden" name="id" value={p.id} />}
        <div className="astack agrid-wide">
          <Card title="Informations">
            <div className="aform aform--grid">
              <label className="afield afield--full"><span>Nom</span><input name="name" defaultValue={p?.name} required maxLength={120} /></label>
              <label className="afield"><span>Catégorie</span>
                <select name="categoryId" defaultValue={p?.categoryId ?? ""}>
                  <option value="">—</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="afield"><span>Adresse (slug)</span><input name="slug" defaultValue={p?.slug} placeholder="automatique" /></label>
              <label className="afield afield--full"><span>Accroche (cartes)</span><input name="shortDescription" defaultValue={p?.shortDescription ?? ""} maxLength={240} /></label>
              <label className="afield afield--full"><span>Description</span><textarea name="description" defaultValue={p?.description ?? ""} rows={4} maxLength={2000} /></label>
              <label className="afield afield--full"><span>Composition</span><textarea name="composition" defaultValue={p?.composition ?? ""} rows={2} maxLength={1000} /></label>
            </div>
          </Card>
          <Card title="Prix et formats">
            <div className="aform aform--grid">
              <label className="afield"><span>Prix (€ TTC)</span><input name="price" defaultValue={p ? euros(p.priceCents) : ""} inputMode="decimal" required /></label>
              <label className="afield"><span>TVA (%)</span>
                <select name="vat" defaultValue={p ? String(p.vatRate / 100) : "5.5"}>
                  {["5.5", "10", "20"].map((v) => <option key={v} value={v}>{v.replace(".", ",")} %</option>)}
                </select>
              </label>
            </div>
            <p className="amuted">Formats (ex. 4, 6, 8 personnes) : s’ils existent, leur prix remplace le prix de base.</p>
            <VariantRows initial={variants.map((v) => ({ id: v.id, label: v.label, servings: v.servings, price: euros(v.priceCents) }))} />
          </Card>
          <Card title="Allergènes">
            <div className="achecks">
              {ALLERGENS.map((a) => (
                <label key={a} className="acheck"><input type="checkbox" name="allergens" value={a} defaultChecked={p?.allergens.includes(a)} /> {a}</label>
              ))}
            </div>
          </Card>
        </div>
        <div className="astack">
          <Card title="Photo">
            {p?.image && <img src={p.image} alt="" className="apreview" />}
            <input type="hidden" name="image" value={p?.image ?? ""} />
            <label className="afield"><span>Nouvelle photo (JPG, PNG, WEBP — compressée automatiquement)</span><ImageInput name="imageFile" /></label>
          </Card>
          <Card title="Disponibilité">
            <div className="achecks achecks--col">
              <label className="acheck"><input type="checkbox" name="active" defaultChecked={p ? p.active : true} /> Visible sur le site</label>
              <label className="acheck"><input type="checkbox" name="orderable" defaultChecked={p ? p.orderable : true} /> Commande autorisée</label>
              <label className="acheck"><input type="checkbox" name="clickCollect" defaultChecked={p ? p.clickCollect : true} /> Retrait en boutique (commande en ligne)</label>
              <label className="acheck"><input type="checkbox" name="seasonal" defaultChecked={p?.seasonal} /> Produit saisonnier (commandable uniquement pendant sa campagne)</label>
              <label className="acheck"><input type="checkbox" name="featured" defaultChecked={p?.featured} /> Mis en avant (accueil)</label>
            </div>
            <div className="aform aform--grid">
              <label className="afield"><span>Délai de préparation (heures)</span><input type="number" name="leadTimeHours" min={0} max={720} defaultValue={p?.leadTimeHours ?? 0} /></label>
              <label className="afield"><span>Quantité minimale par commande</span><input type="number" name="minQuantity" min={1} max={50} defaultValue={p?.minQuantity ?? 1} /></label>
              <label className="afield"><span>Ordre d’affichage</span><input type="number" name="position" defaultValue={p?.position ?? 0} /></label>
            </div>
            <p className="amuted">Le stock se règle dans <Link href="/admin/stock" className="alink">Stock</Link>. La commande en ligne doit aussi être ouverte pour la catégorie.</p>
            <label className="acheck"><input type="checkbox" name="isDemo" defaultChecked={p?.isDemo ?? false} /> Donnée d’exemple (prix et description non validés) — visible uniquement en mode démonstration</label>
          </Card>
          <div className="asticky-save"><Submit className="abtn abtn--lg">Enregistrer le produit</Submit></div>
        </div>
      </form>
    </>
  );
}

/* eslint-disable @next/next/no-img-element */
import { asc } from "drizzle-orm";
import { Card, PageTitle } from "@/components/admin/bits";
import { Submit } from "@/components/admin/ui";
import { requirePage } from "@/lib/auth/session";
import { getDb, schema as s } from "@/lib/db";
import type { Category } from "@/lib/db/schema";
import { ImageInput } from "@/components/admin/ImageInput";
import { saveCategory } from "../../actions";

export const metadata = { title: "Catégories" };

function CategoryForm({ c }: { c?: Category }) {
  return (
    <form action={saveCategory} className="aform aform--grid">
      <input type="hidden" name="back" value="/admin/categories" />
      {c && <input type="hidden" name="id" value={c.id} />}
      <input type="hidden" name="image" value={c?.image ?? ""} />
      <label className="afield"><span>Nom</span><input name="name" defaultValue={c?.name} required maxLength={80} /></label>
      <label className="afield"><span>Adresse (slug)</span><input name="slug" defaultValue={c?.slug} placeholder="automatique" /></label>
      <label className="afield afield--full"><span>Accroche</span><input name="tagline" defaultValue={c?.tagline ?? ""} maxLength={160} /></label>
      <label className="afield afield--full"><span>Description</span><textarea name="description" defaultValue={c?.description ?? ""} rows={2} maxLength={1000} /></label>
      <label className="afield"><span>Titre SEO</span><input name="seoTitle" defaultValue={c?.seoTitle ?? ""} maxLength={120} /></label>
      <label className="afield"><span>Description SEO</span><input name="seoDescription" defaultValue={c?.seoDescription ?? ""} maxLength={300} /></label>
      <label className="afield"><span>Photo</span><ImageInput name="imageFile" /></label>
      <label className="afield"><span>Ordre</span><input type="number" name="position" defaultValue={c?.position ?? 0} /></label>
      <label className="acheck"><input type="checkbox" name="active" defaultChecked={c ? c.active : true} /> Visible</label>
      <div><Submit>{c ? "Enregistrer" : "Créer la catégorie"}</Submit></div>
    </form>
  );
}

export default async function CategoriesPage() {
  await requirePage("ADMIN");
  const db = await getDb();
  const cats = await db.select().from(s.categories).orderBy(asc(s.categories.position));
  return (
    <>
      <PageTitle title="Catégories" sub="Familles du catalogue, pages /commander/… et cartes de l’accueil." />
      <div className="astack">
        {cats.map((c) => (
          <Card key={c.id} title={<span className="acat-title">{c.image && <img src={c.image} alt="" />}{c.name}{!c.active && <span className="atag">masquée</span>}</span>}>
            <CategoryForm c={c} />
          </Card>
        ))}
        <Card title="Nouvelle catégorie"><CategoryForm /></Card>
      </div>
    </>
  );
}

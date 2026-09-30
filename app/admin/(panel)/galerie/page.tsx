/* eslint-disable @next/next/no-img-element */
import { asc } from "drizzle-orm";
import { Card, PageTitle } from "@/components/admin/bits";
import { Submit } from "@/components/admin/ui";
import { requirePage } from "@/lib/auth/session";
import { getDb, schema as s } from "@/lib/db";
import { ImageInput } from "@/components/admin/ImageInput";
import { galleryFilters } from "@/lib/site-data";
import { updateMedia, uploadMedia } from "../../actions";

export const metadata = { title: "Galerie" };

const formats = [["wide", "Large"], ["landscape", "Paysage"], ["medium", "Moyen"], ["square", "Carré"], ["portrait", "Portrait"]];
const cats = galleryFilters.filter((f) => f.id !== "tout");

export default async function GalleryAdmin() {
  await requirePage("ADMIN");
  const db = await getDb();
  const rows = await db.select().from(s.media).orderBy(asc(s.media.position), asc(s.media.createdAt));
  return (
    <>
      <PageTitle title="Galerie" sub="Photos de la page Galerie et du carrousel de l’accueil (10 premières)." />
      <Card title="Ajouter des photos">
        <form action={uploadMedia} className="aform aform--inline">
          <input type="hidden" name="back" value="/admin/galerie" />
          <label className="afield"><span>Images (JPG, PNG, WEBP — compressées automatiquement, 6 par envoi)</span><ImageInput name="files" multiple required /></label>
          <label className="afield"><span>Catégorie</span><select name="category">{cats.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
          <label className="afield"><span>Format</span><select name="format">{formats.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
          <label className="afield"><span>Texte alternatif</span><input name="alt" placeholder="Description de la photo" /></label>
          <label className="afield"><span>Légende</span><input name="caption" /></label>
          <Submit>Ajouter</Submit>
        </form>
      </Card>
      <div className="amedia">
        {rows.map((m) => (
          <form key={m.id} action={updateMedia} className="amedia-item" data-off={m.inGallery ? undefined : ""}>
            <img src={m.url} alt={m.alt} />
            <input type="hidden" name="id" value={m.id} />
            <input type="hidden" name="back" value="/admin/galerie" />
            <input name="alt" defaultValue={m.alt} placeholder="Texte alternatif" aria-label="Texte alternatif" />
            <input name="caption" defaultValue={m.caption ?? ""} placeholder="Légende" aria-label="Légende" />
            <div className="amedia-row">
              <select name="category" defaultValue={m.category} aria-label="Catégorie">{cats.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
              <select name="format" defaultValue={m.format} aria-label="Format">{formats.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
              <input type="number" name="position" defaultValue={m.position} aria-label="Ordre" />
            </div>
            <label className="acheck"><input type="checkbox" name="inGallery" defaultChecked={m.inGallery} /> Affichée</label>
            <div className="amedia-row">
              <Submit className="abtn abtn--sm">Enregistrer</Submit>
              <Submit className="abtn abtn--ghost abtn--sm" name="delete" value="1" confirm="Retirer cette image de la galerie ?">Retirer</Submit>
            </div>
          </form>
        ))}
      </div>
    </>
  );
}

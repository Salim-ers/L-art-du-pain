/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { Card, Kpi, PageTitle } from "@/components/admin/bits";
import { Submit } from "@/components/admin/ui";
import { requirePage } from "@/lib/auth/session";
import { getCampaign } from "@/lib/catalog";
import { getDb, schema as s } from "@/lib/db";
import { campaignStateLabel } from "@/lib/events";
import { ACCEPTED_IMAGES } from "@/lib/storage";
import { toParisInput as local } from "@/lib/format";
import { saveEvent } from "../../../actions";

export const metadata = { title: "Campagne" };

const kinds = [
  ["noel", "Noël"], ["nouvel-an", "Nouvel An"], ["epiphanie", "Épiphanie / galettes"], ["saint-valentin", "Saint-Valentin"], ["paques", "Pâques"],
  ["ramadan", "Ramadan"], ["aid", "Aïd"], ["fete-des-meres", "Fête des mères"], ["fete-des-peres", "Fête des pères"], ["mariages", "Mariages"], ["custom", "Autre"],
];


export default async function EventForm({ params }: { params: { id: string } }) {
  await requirePage("ADMIN");
  const db = await getDb();
  const isNew = params.id === "nouveau";
  if (!isNew && !/^[0-9a-f-]{36}$/.test(params.id)) notFound();
  const [row] = isNew ? [null] : await db.select().from(s.events).where(eq(s.events.id, params.id));
  if (!isNew && !row) notFound();
  const e = row ? await getCampaign(row.slug) : null;
  const [products, links] = await Promise.all([
    db.select().from(s.products).orderBy(asc(s.products.name)),
    e ? db.select().from(s.eventProducts).where(eq(s.eventProducts.eventId, e.id)) : [],
  ]);
  const linked = new Set(links.map((l) => l.productId));
  const back = isNew ? "/admin/evenements/nouveau" : "/admin/evenements/" + e!.id;
  const sorted = [...products].sort((a, b) => Number(linked.has(b.id)) - Number(linked.has(a.id)) || Number(b.seasonal) - Number(a.seasonal));

  return (
    <>
      <PageTitle title={isNew ? "Nouvelle campagne" : e!.name} sub={<Link href="/admin/evenements" className="alink">← Toutes les campagnes</Link>}>
        {e && <Link href={e.kind === "noel" ? "/noel" : "/evenements/" + e.slug} target="_blank" className="abtn abtn--ghost">Voir la page ↗</Link>}
      </PageTitle>
      {e && (
        <div className="akpis">
          <Kpi label="État" value={campaignStateLabel[e.state]} />
          <Kpi label="Commandes" value={e.orderCount} />
          <Kpi label="Places restantes" value={e.maxOrders !== null ? Math.max(0, e.maxOrders - e.orderCount) : "∞"} />
          <Kpi label="Dates de retrait" value={e.dates.length} />
        </div>
      )}
      <form action={saveEvent} className="agrid">
        <input type="hidden" name="back" value={back} />
        {e && <input type="hidden" name="id" value={e.id} />}
        <div className="astack agrid-wide">
          <Card title="Page publique">
            <div className="aform aform--grid">
              <label className="afield"><span>Nom interne</span><input name="name" defaultValue={e?.name} required placeholder="Noël 2026" /></label>
              <label className="afield"><span>Type</span>
                <select name="kind" defaultValue={e?.kind ?? "custom"}>{kinds.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
              </label>
              <label className="afield"><span>Adresse (slug)</span><input name="slug" defaultValue={e?.slug} placeholder="automatique" /></label>
              <label className="afield"><span>Ordre</span><input type="number" name="position" defaultValue={e?.position ?? 0} /></label>
              <label className="afield afield--full"><span>Titre</span><input name="headline" defaultValue={e?.headline ?? ""} placeholder="Nos créations de Noël" /></label>
              <label className="afield afield--full"><span>Sous-titre</span><input name="subtitle" defaultValue={e?.subtitle ?? ""} placeholder="Des fêtes façonnées avec gourmandise." /></label>
              <label className="afield afield--full"><span>Texte d’introduction</span><textarea name="description" defaultValue={e?.description ?? ""} rows={3} /></label>
              <label className="afield"><span>Titre SEO</span><input name="seoTitle" defaultValue={e?.seoTitle ?? ""} /></label>
              <label className="afield"><span>Description SEO</span><input name="seoDescription" defaultValue={e?.seoDescription ?? ""} /></label>
            </div>
          </Card>
          <Card title="Précommandes">
            <div className="aform aform--grid">
              <label className="afield"><span>Ouverture</span><input type="datetime-local" name="orderOpensAt" defaultValue={local(e?.orderOpensAt ?? null)} /></label>
              <label className="afield"><span>Fermeture</span><input type="datetime-local" name="orderClosesAt" defaultValue={local(e?.orderClosesAt ?? null)} /></label>
              <label className="afield"><span>Nombre maximum de commandes</span><input type="number" name="maxOrders" min={0} defaultValue={e?.maxOrders ?? ""} placeholder="illimité" /></label>
              <span />
              <label className="afield"><span>Retraits : du</span><input type="date" name="pickupStart" defaultValue={e?.pickupStart ?? ""} /></label>
              <label className="afield"><span>au</span><input type="date" name="pickupEnd" defaultValue={e?.pickupEnd ?? ""} /></label>
              <label className="afield afield--full"><span>Ou dates précises autorisées (AAAA-MM-JJ, séparées par des virgules — prioritaires sur la plage)</span>
                <textarea name="pickupDates" rows={2} defaultValue={e?.pickupDates.join(", ") ?? ""} placeholder="2026-12-23, 2026-12-24, 2026-12-31" />
              </label>
            </div>
            <p className="amuted">Une fois le quota atteint, la campagne passe « Complet » et plus aucun produit ne peut être commandé. Les produits cochés « saisonniers » ne sont commandables que pendant la fenêtre de précommande.</p>
          </Card>
          <Card title="Produits de la campagne">
            <div className="achecks achecks--grid">
              {sorted.map((p) => (
                <label key={p.id} className="acheck">
                  <input type="checkbox" name="products" value={p.id} defaultChecked={linked.has(p.id)} /> {p.name}
                  {p.seasonal && <span className="atag">saison</span>}
                  {!p.active && <span className="atag">désactivé</span>}
                </label>
              ))}
            </div>
          </Card>
        </div>
        <div className="astack">
          <Card title="Visuel">
            {e?.heroImage && <img src={e.heroImage} alt="" className="apreview" />}
            <input type="hidden" name="heroImage" value={e?.heroImage ?? ""} />
            <label className="afield"><span>Photo plein écran (sinon ambiance lumineuse par défaut)</span><input type="file" name="imageFile" accept={ACCEPTED_IMAGES} /></label>
          </Card>
          <Card title="Publication">
            <label className="acheck"><input type="checkbox" name="published" defaultChecked={e?.published} /> Publiée sur le site</label>
          </Card>
          <div className="asticky-save"><Submit className="abtn abtn--lg">Enregistrer la campagne</Submit></div>
        </div>
      </form>
    </>
  );
}

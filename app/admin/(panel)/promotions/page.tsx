import { desc } from "drizzle-orm";
import { Card, PageTitle } from "@/components/admin/bits";
import { Submit } from "@/components/admin/ui";
import { requirePage } from "@/lib/auth/session";
import { getDb, schema as s } from "@/lib/db";
import type { Promotion } from "@/lib/db/schema";
import { money, toParisInput as local } from "@/lib/format";
import { savePromotion } from "../../actions";

export const metadata = { title: "Promotions" };


function PromoForm({ p }: { p?: Promotion }) {
  return (
    <form action={savePromotion} className="aform aform--grid">
      <input type="hidden" name="back" value="/admin/promotions" />
      {p && <input type="hidden" name="id" value={p.id} />}
      <label className="afield"><span>Code</span><input name="code" defaultValue={p?.code} required placeholder="NOEL10" /></label>
      <label className="afield"><span>Libellé</span><input name="label" defaultValue={p?.label} required placeholder="Remise de Noël" /></label>
      <label className="afield"><span>Type</span>
        <select name="type" defaultValue={p?.type ?? "percent"}><option value="percent">Pourcentage</option><option value="amount">Montant (€)</option></select>
      </label>
      <label className="afield"><span>Valeur (% ou €)</span><input name="value" defaultValue={p ? (p.type === "percent" ? p.value : (p.value / 100).toFixed(2).replace(".", ",")) : ""} required /></label>
      <label className="afield"><span>Minimum d’achat (€)</span><input name="min" defaultValue={p ? (p.minSubtotalCents / 100).toFixed(2).replace(".", ",") : "0"} /></label>
      <label className="afield"><span>Utilisations max.</span><input type="number" name="maxUses" defaultValue={p?.maxUses ?? ""} placeholder="illimité" /></label>
      <label className="afield"><span>Début</span><input type="datetime-local" name="startsAt" defaultValue={local(p?.startsAt ?? null)} /></label>
      <label className="afield"><span>Fin</span><input type="datetime-local" name="endsAt" defaultValue={local(p?.endsAt ?? null)} /></label>
      <label className="acheck"><input type="checkbox" name="active" defaultChecked={p ? p.active : true} /> Actif</label>
      <div><Submit>{p ? "Enregistrer" : "Créer le code"}</Submit></div>
    </form>
  );
}

export default async function PromotionsPage() {
  await requirePage("ADMIN");
  const db = await getDb();
  const rows = await db.select().from(s.promotions).orderBy(desc(s.promotions.createdAt));
  return (
    <>
      <PageTitle title="Promotions" sub="Codes promo saisis par le client au moment du paiement." />
      <div className="astack">
        <Card title="Nouveau code"><PromoForm /></Card>
        {rows.map((p) => (
          <Card key={p.id} title={<>{p.code} <span className="amuted">— {p.type === "percent" ? p.value + " %" : money(p.value)} · utilisé {p.uses}{p.maxUses !== null ? "/" + p.maxUses : ""} fois{!p.active && " · inactif"}</span></>}>
            <PromoForm p={p} />
          </Card>
        ))}
      </div>
    </>
  );
}

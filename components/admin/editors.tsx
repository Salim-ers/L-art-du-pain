"use client";

import { useState } from "react";

type CakeType = { id: string; name: string; description: string; image: string | null; price: string };

export function CakeTypesEditor({ initial }: { initial: CakeType[] }) {
  const [rows, setRows] = useState<CakeType[]>(initial);
  return (
    <div className="arepeat">
      {rows.map((r, i) => (
        <div key={r.id || "n" + i} className="arepeat-row arepeat-row--cake">
          <input type="hidden" name="tId" value={r.id} />
          <input name="tName" defaultValue={r.name} placeholder="Nom (ex. Entremets)" aria-label="Nom" />
          <input name="tPrice" defaultValue={r.price} placeholder="€ / part" inputMode="decimal" aria-label="Prix par personne" />
          <input name="tImage" defaultValue={r.image ?? ""} placeholder="/images/… ou URL" aria-label="Image" />
          <textarea name="tDesc" defaultValue={r.description} rows={2} placeholder="Description" aria-label="Description" />
          <button type="button" className="abtn abtn--ghost abtn--sm" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label="Retirer">×</button>
        </div>
      ))}
      <button type="button" className="abtn abtn--ghost abtn--sm" onClick={() => setRows([...rows, { id: "", name: "", description: "", image: null, price: "" }])}>
        + Ajouter un type de gâteau
      </button>
    </div>
  );
}

type Review = { text: string; author: string; rating?: number };

export function ReviewsEditor({ initial }: { initial: Review[] }) {
  const [rows, setRows] = useState<Review[]>(initial);
  return (
    <div className="arepeat">
      {rows.map((r, i) => (
        <div key={i} className="arepeat-row arepeat-row--review">
          <textarea name="rText" defaultValue={r.text} rows={2} placeholder="Texte exact de l’avis Google" aria-label="Avis" />
          <input name="rAuthor" defaultValue={r.author} placeholder="Prénom N." aria-label="Auteur" />
          <select name="rRating" defaultValue={r.rating ? String(r.rating) : ""} aria-label="Note">
            <option value="">—</option>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
          </select>
          <button type="button" className="abtn abtn--ghost abtn--sm" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label="Retirer">×</button>
        </div>
      ))}
      <button type="button" className="abtn abtn--ghost abtn--sm" onClick={() => setRows([...rows, { text: "", author: "" }])}>+ Ajouter un avis</button>
    </div>
  );
}

type Assurance = { title: string; text: string };

/** Engagements affichés sur l'accueil (réassurance) : uniquement des engagements vérifiés. */
export function ReassuranceEditor({ initial }: { initial: Assurance[] }) {
  const [rows, setRows] = useState<Assurance[]>(initial);
  return (
    <div className="arepeat">
      {rows.map((r, i) => (
        <div key={i} className="arepeat-row">
          <input name="aTitle" defaultValue={r.title} maxLength={60} placeholder="Retrait en boutique" aria-label="Engagement" />
          <input name="aText" defaultValue={r.text} maxLength={200} placeholder="Une phrase d’explication" aria-label="Précision" />
          <button type="button" className="abtn abtn--ghost abtn--sm" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label="Retirer">×</button>
        </div>
      ))}
      {rows.length < 6 && (
        <button type="button" className="abtn abtn--ghost abtn--sm" onClick={() => setRows([...rows, { title: "", text: "" }])}>+ Ajouter un engagement</button>
      )}
    </div>
  );
}
